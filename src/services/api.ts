import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { User, Client, Product, Invoice, Payment, Template, PlanType } from '@/lib/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    if (error.response?.status === 401) {
      // Unauthorized: Clear token and redirect to login
      removeToken();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
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

// ==================== Auth Services ====================

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post<AuthResponse>('/login', { email, password });
    setToken(response.data.token);
    return { user: response.data.user, token: response.data.token };
  },

  register: async (
    name: string,
    email: string,
    password: string,
    plan: PlanType = 'free'
  ): Promise<{ user: User; token: string }> => {
    const response = await api.post<AuthResponse>('/register', {
      name,
      email,
      password,
      password_confirmation: password,
      plan,
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

  updatePlan: async (plan: PlanType): Promise<User> => {
    const response = await api.put<{ success: boolean; user: User }>('/plan', { plan });
    return response.data.user;
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/verify-email', { token });
  },

  resendVerification: async (): Promise<void> => {
    await api.post('/resend-verification');
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

export const notificationService = {
  sendSms: async (invoiceId: string | number, message: string): Promise<SmsResponse> => {
    const response = await api.post<SmsResponse>(`/invoices/${invoiceId}/send-sms`, { message });
    return response.data;
  },

  getEmailPreview: async (invoiceId: string | number): Promise<{ subject: string; body: string }> => {
    const response = await api.get(`/invoices/${invoiceId}/email-preview`);
    return response.data;
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

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  invoices: number;
}

export const reportService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getMonthlyRevenue: async (year?: number): Promise<MonthlyRevenue[]> => {
    const response = await api.get('/reports/monthly-revenue', { params: { year } });
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
};

export default api;
