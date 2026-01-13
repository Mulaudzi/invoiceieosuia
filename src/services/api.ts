import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { User, Client, Product, Invoice, Payment, Template, PlanType } from '@/lib/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://invoices.ieosuia.com/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'ieosuia_auth_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Request interceptor: Add auth token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (error.response?.status === 401) {
      // Unauthorized: Don't auto-redirect for admin routes - let the page handle it
      if (!isAdminRoute) {
        removeToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
      // For admin routes, just reject the error and let the component handle it
    } else if (error.response?.status === 403) {
      // Forbidden: Tier limit reached or insufficient permissions
      const message = error.response.data?.message || 'Access denied. You may need to upgrade your plan.';
      throw new Error(message);
    } else if (error.response?.status === 422) {
      // Validation error
      const errors = error.response.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        throw new Error(firstError || 'Validation failed');
      }
    }
    return Promise.reject(error);
  }
);

// Type for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface UserDataExport {
  user: User;
  clients: Client[];
  products: Product[];
  invoices: Invoice[];
  payments: Payment[];
  templates: Template[];
  exported_at: string;
}

// ==================== Auth Services ====================

export const authService = {
  login: async (email: string, password: string, recaptchaToken?: string): Promise<{ user: User; token: string }> => {
    try {
      const response = await api.post<AuthResponse>('/login', { 
        email, 
        password,
        recaptcha_token: recaptchaToken 
      });
      setToken(response.data.token);
      return { user: response.data.user, token: response.data.token };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Google OAuth
  getGoogleAuthUrl: async (): Promise<string> => {
    const response = await api.get<{ url: string }>('/auth/google');
    return response.data.url;
  },

  googleCallback: async (code: string): Promise<{ user: User; token: string }> => {
    const response = await api.post<AuthResponse>('/auth/google/callback', { code });
    setToken(response.data.token);
    return { user: response.data.user, token: response.data.token };
  },

  register: async (
    name: string,
    email: string,
    password: string,
    plan: PlanType = 'free',
    recaptchaToken?: string
  ): Promise<{ user: User; token: string }> => {
    const response = await api.post<AuthResponse>('/register', {
      name,
      email,
      password,
      password_confirmation: password,
      plan,
      recaptcha_token: recaptchaToken,
    });
    setToken(response.data.token);
    return { user: response.data.user, token: response.data.token };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } finally {
      removeToken();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; user: User }>('/user');
    return response.data.user;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<{ success: boolean; user: User }>('/profile', data);
    return response.data.user;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/password', { current_password: currentPassword, new_password: newPassword });
  },

  uploadAvatar: async (file: File): Promise<{ avatar: string; user: User }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ message: string; avatar: string; user: User }>('/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { avatar: response.data.avatar, user: response.data.user };
  },

  deleteAvatar: async (): Promise<User> => {
    const response = await api.delete<{ message: string; user: User }>('/avatar');
    return response.data.user;
  },

  updatePlan: async (plan: PlanType): Promise<User> => {
    const response = await api.put<{ success: boolean; user: User }>('/plan', { plan });
    return response.data.user;
  },

  // PayFast integration
  initiatePayment: async (plan: PlanType): Promise<{ payment_url: string }> => {
    const response = await api.post<{ success: boolean; payment_url: string }>('/payfast/checkout', { plan });
    return { payment_url: response.data.payment_url };
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/verify-email', { token });
  },

  resendVerification: async (): Promise<void> => {
    await api.post('/resend-verification');
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await api.post('/forgot-password', { email });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await api.post('/reset-password', { token, password, password_confirmation: password });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // GDPR: Export user data
  exportUserData: async (): Promise<UserDataExport> => {
    const response = await api.get<UserDataExport>('/gdpr/export');
    return response.data;
  },

  // GDPR: Delete account
  deleteAccount: async (): Promise<void> => {
    await api.delete('/gdpr/delete');
    removeToken();
  },
};

// ==================== Client Services ====================

export const clientService = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get<PaginatedResponse<Client>>('/clients');
    return response.data.data;
  },

  getById: async (id: string | number): Promise<Client> => {
    const response = await api.get<{ success: boolean; client: Client }>(`/clients/${id}`);
    return response.data.client;
  },

  create: async (data: Omit<Client, 'id' | 'userId' | 'createdAt'>): Promise<Client> => {
    const response = await api.post<{ success: boolean; client: Client }>('/clients', data);
    return response.data.client;
  },

  update: async (id: string | number, data: Partial<Client>): Promise<Client> => {
    const response = await api.put<{ success: boolean; client: Client }>(`/clients/${id}`, data);
    return response.data.client;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

// ==================== Product Services ====================

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<PaginatedResponse<Product>>('/products');
    return response.data.data;
  },

  getById: async (id: string | number): Promise<Product> => {
    const response = await api.get<{ success: boolean; product: Product }>(`/products/${id}`);
    return response.data.product;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<{ success: boolean; categories: string[] }>('/products/categories');
    return response.data.categories;
  },

  create: async (data: Omit<Product, 'id' | 'userId' | 'createdAt'>): Promise<Product> => {
    const response = await api.post<{ success: boolean; product: Product }>('/products', data);
    return response.data.product;
  },

  update: async (id: string | number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<{ success: boolean; product: Product }>(`/products/${id}`, data);
    return response.data.product;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// ==================== Invoice Services ====================

export interface CreateInvoiceData {
  client_id: string | number;
  template_id?: string | number;
  status?: string;
  date: string;
  due_date: string;
  notes?: string;
  items: Array<{
    product_id?: string | number;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    tax_rate: number;
  }>;
}

export const invoiceService = {
  getAll: async (): Promise<Invoice[]> => {
    const response = await api.get<PaginatedResponse<Invoice>>('/invoices');
    return response.data.data;
  },

  getById: async (id: string | number): Promise<Invoice> => {
    const response = await api.get<{ success: boolean; invoice: Invoice }>(`/invoices/${id}`);
    return response.data.invoice;
  },

  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post<{ success: boolean; invoice: Invoice }>('/invoices', data);
    return response.data.invoice;
  },

  update: async (id: string | number, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
    const response = await api.put<{ success: boolean; invoice: Invoice }>(`/invoices/${id}`, data);
    return response.data.invoice;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  downloadPdf: async (id: string | number): Promise<void> => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  send: async (id: string | number, message?: string): Promise<void> => {
    await api.post(`/invoices/${id}/send`, { message });
  },

  markPaid: async (id: string | number): Promise<Invoice> => {
    const response = await api.post<{ success: boolean; invoice: Invoice }>(`/invoices/${id}/mark-paid`);
    return response.data.invoice;
  },
};

// ==================== Template Services ====================

export const templateService = {
  getAll: async (): Promise<Template[]> => {
    const response = await api.get<PaginatedResponse<Template>>('/templates');
    return response.data.data;
  },

  getById: async (id: string | number): Promise<Template> => {
    const response = await api.get<{ success: boolean; template: Template }>(`/templates/${id}`);
    return response.data.template;
  },

  create: async (data: Omit<Template, 'id' | 'userId' | 'createdAt'>): Promise<Template> => {
    const response = await api.post<{ success: boolean; template: Template }>('/templates', data);
    return response.data.template;
  },

  update: async (id: string | number, data: Partial<Template>): Promise<Template> => {
    const response = await api.put<{ success: boolean; template: Template }>(`/templates/${id}`, data);
    return response.data.template;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  setDefault: async (id: string | number): Promise<Template> => {
    const response = await api.post<{ success: boolean; template: Template }>(`/templates/${id}/set-default`);
    return response.data.template;
  },
};

// ==================== Payment Services ====================

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const response = await api.get<PaginatedResponse<Payment>>('/payments');
    return response.data.data;
  },

  getSummary: async (): Promise<{
    total_received: number;
    this_month: number;
    last_month: number;
    by_method: Record<string, number>;
  }> => {
    const response = await api.get('/payments/summary');
    return response.data;
  },

  create: async (data: {
    invoice_id: string | number;
    amount: number;
    method: string;
    date: string;
    notes?: string;
  }): Promise<Payment> => {
    const response = await api.post<{ success: boolean; payment: Payment }>('/payments', data);
    return response.data.payment;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};

// ==================== Notification Services ====================

export interface SmsResponse {
  success: boolean;
  delivery_id?: string;
  message: string;
}

export interface UserNotification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedType?: string;
  relatedId?: number;
}

export const notificationService = {
  sendSms: async (invoiceId: string | number, message: string): Promise<SmsResponse> => {
    const response = await api.post<SmsResponse>(`/invoices/${invoiceId}/send-sms`, { message });
    return response.data;
  },

  getEmailPreview: async (invoiceId: string | number): Promise<{ subject: string; body: string }> => {
    const response = await api.get(`/invoices/${invoiceId}/email-preview`);
    return response.data;
  },

  // User notifications
  getNotifications: async (): Promise<{ notifications: UserNotification[]; unread_count: number }> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await api.delete('/notifications');
  },
};

// ==================== Report Services ====================

export interface DashboardStats {
  total_revenue: number;
  outstanding: number;
  overdue_count: number;
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  total_clients: number;
  active_clients: number;
}

export interface ExtendedDashboardStats extends DashboardStats {
  new_clients_this_month: number;
  revenue_change: number;
  current_month_invoices: number;
  last_month_invoices: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  invoices: number;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  invoices: number;
  avg_value: number;
}

export interface PaymentTimelineItem {
  name: string;
  value: number;
  count: number;
}

export interface PaymentTimelineResponse {
  timeline: PaymentTimelineItem[];
  total_payments: number;
  paid_within_14_days: number;
}

export interface BillingHistoryItem {
  id: number;
  date: string;
  amount: number;
  plan: string;
  status: string;
  payment_id: string | null;
}

export const reportService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getExtendedStats: async (): Promise<ExtendedDashboardStats> => {
    const response = await api.get('/reports/extended-stats');
    return response.data;
  },

  getMonthlyRevenue: async (year?: number): Promise<MonthlyRevenue[]> => {
    const response = await api.get('/reports/monthly-revenue', { params: { year } });
    return response.data;
  },

  getMonthlyStats: async (months?: number): Promise<MonthlyStats[]> => {
    const response = await api.get('/reports/monthly-stats', { params: { months } });
    return response.data;
  },

  getInvoiceStatus: async (): Promise<{ status: string; count: number; amount: number }[]> => {
    const response = await api.get('/reports/invoice-status');
    return response.data;
  },

  getTopClients: async (limit?: number): Promise<{ client: Client; total: number; invoices: number }[]> => {
    const response = await api.get('/reports/top-clients', { params: { limit } });
    return response.data;
  },

  getIncomeExpense: async (startDate?: string, endDate?: string): Promise<{
    income: number;
    expenses: number;
    net: number;
    by_month: { month: string; income: number; expenses: number }[];
  }> => {
    const response = await api.get('/reports/income-expense', { params: { start_date: startDate, end_date: endDate } });
    return response.data;
  },

  getRecentInvoices: async (limit?: number): Promise<Invoice[]> => {
    const response = await api.get('/reports/recent-invoices', { params: { limit } });
    return response.data;
  },

  getPaymentTimeline: async (): Promise<PaymentTimelineResponse> => {
    const response = await api.get('/reports/payment-timeline');
    return response.data;
  },

  getBillingHistory: async (): Promise<BillingHistoryItem[]> => {
    const response = await api.get('/reports/billing-history');
    return response.data;
  },

  exportReport: async (type: 'pdf' | 'excel', reportType: string): Promise<void> => {
    const response = await api.get(`/reports/export`, { 
      params: { type, report: reportType },
      responseType: 'blob' 
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ==================== Contact Form Service ====================

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  purpose: 'general' | 'support' | 'sales';
  origin: string;
  recaptcha_token?: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  recipient?: string;
}

export const contactService = {
  submit: async (data: ContactFormData): Promise<ContactFormResponse> => {
    try {
      const response = await api.post<ContactFormResponse>('/contact', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
};

export default api;
