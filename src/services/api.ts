import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { User, Client, Product, Invoice, Template, defaultTemplateStyles } from '@/lib/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://invoices.ieosuia.com/api';

// Create axios instance with timeout
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout for all requests
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
    const isAdminRoute = window.location.pathname.startsWith('/guymhan');
    const isAuthEndpoint = error.config?.url?.includes('/login') || 
                 error.config?.url?.includes('/register');
    
    if (error.response?.status === 401) {
      // For auth endpoints (login, register, google), let the error propagate
      // so the calling code can display the proper error message
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      // Unauthorized: Don't auto-redirect for admin routes - let the page handle it
      if (!isAdminRoute) {
        removeToken();
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
      // For admin routes, just reject the error and let the component handle it
    } else if (error.response?.status === 403) {
      // Forbidden: Tier limit reached or insufficient permissions
      const message = error.response.data?.message || 'Access denied.';
      throw new Error(message);
    } else if (error.response?.status === 422) {
      // Validation error
      const errors = error.response.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        throw new Error(firstError || 'Validation failed');
      }
      const message = error.response.data?.message;
      if (message) throw new Error(message);
    }
    if (!error.response) {
      throw new Error(error.code === 'ECONNABORTED' ? 'The request took too long. Please check your connection and try again.' : 'We could not reach the service. Please check your connection and try again.');
    }
    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    if (status >= 500) throw new Error('Something went wrong while saving your changes. Please try again in a moment.');
    if (status === 409) throw new Error(serverMessage || 'This action has already been completed. Refresh the page before trying again.');
    if (status === 404) throw new Error('The item could not be found. It may have been changed or removed; refresh the page and try again.');
    if (status === 429) throw new Error('Too many attempts were made. Please wait a moment and try again.');
    if (serverMessage) throw new Error(serverMessage);
    throw new Error('We could not complete that action. Please review the information and try again.');
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

type ApiProduct = Partial<Product> & {
  id: string | number;
  user_id?: string | number;
  tax_rate?: string | number;
  created_at?: string;
  price: string | number;
};

type ApiClient = Omit<Partial<Client>, 'id'> & {
  id: string | number;
  user_id?: string | number;
  created_at?: string;
};

type ApiTemplate = Omit<Partial<Template>, 'id'> & {
  id: string | number;
  user_id?: string | number;
  is_default?: boolean | number | string;
  created_at?: string;
};

type ApiInvoiceItem = Partial<Invoice['items'][number]> & {
  product_id?: string | number | null;
  description?: string;
  tax_rate?: string | number;
  unit_price?: string | number;
  discount_rate?: string | number;
  group_name?: string;
};

type ApiInvoice = Omit<Partial<Invoice>, 'id' | 'items'> & {
  id: string | number;
  user_id?: string | number;
  client_id?: string | number;
  client?: { name?: string; email?: string };
  due_date?: string;
  created_at?: string;
  items?: ApiInvoiceItem[];
  template_id?: string | number;
  document_type?: string;
  recurring_invoice_id?: string | number;
  template_slug?: string;
  template_version?: string | number;
  amount_paid?: string | number;
  balance_due?: string | number;
  payment_history?: Array<{ id: string; amount: string | number; payment_date: string; reference?: string }>;
  invoice_number?: string;
  base_subtotal?: string | number;
  base_tax?: string | number;
  base_total?: string | number;
  credit_total?: string | number;
  debit_total?: string | number;
  linked_documents?: Array<{ id: string | number; invoice_number: string; document_type: string; status: Invoice['status']; date: string; total: string | number }>;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeProduct = (product: ApiProduct): Product => ({
  id: String(product.id),
  userId: String(product.userId ?? product.user_id ?? ''),
  name: product.name ?? '',
  description: product.description ?? '',
  price: toNumber(product.price),
  taxRate: toNumber(product.taxRate ?? product.tax_rate),
  category: product.category ?? '',
  createdAt: product.createdAt ?? product.created_at ?? '',
});

const serializeProduct = (product: Partial<Product>) => ({
  ...product,
  tax_rate: product.taxRate,
});

const normalizeClient = (client: ApiClient): Client => ({
  id: String(client.id),
  userId: String(client.userId ?? client.user_id ?? ''),
  name: client.name ?? '',
  email: client.email ?? '',
  phone: client.phone ?? '',
  company: client.company ?? '',
  address: client.address ?? '',
  status: client.status ?? 'Active',
  createdAt: client.createdAt ?? client.created_at ?? '',
});

const normalizeTemplate = (template: ApiTemplate): Template => ({
  id: String(template.id),
  userId: String(template.userId ?? template.user_id ?? ''),
  name: template.name ?? '',
  description: template.description ?? '',
  isDefault: Boolean(Number(template.isDefault ?? template.is_default ?? 0)),
  styles: { ...defaultTemplateStyles, ...(template.styles ?? {}) },
  createdAt: template.createdAt ?? template.created_at ?? '',
});

const serializeTemplate = (template: Partial<Template>) => ({
  ...template,
  is_default: template.isDefault,
  isDefault: undefined,
});

const normalizeInvoice = (invoice: ApiInvoice): Invoice => ({
  id: String(invoice.id),
  invoiceNumber: invoice.invoiceNumber ?? invoice.invoice_number ?? String(invoice.id),
  userId: String(invoice.userId ?? invoice.user_id ?? ''),
  clientId: String(invoice.clientId ?? invoice.client_id ?? ''),
  clientName: invoice.clientName ?? invoice.client?.name ?? '',
  clientEmail: invoice.clientEmail ?? invoice.client?.email ?? '',
  items: (invoice.items ?? []).map((item) => ({
    productId: String(item.productId ?? item.product_id ?? ''),
    name: item.name ?? item.description ?? '',
    quantity: toNumber(item.quantity, 1),
    price: toNumber(item.price ?? item.unit_price),
    taxRate: toNumber(item.taxRate ?? item.tax_rate),
    description: item.description ?? '',
    sku: item.sku ?? '', unit: item.unit ?? '', group: item.group ?? item.group_name ?? '',
    discountRate: toNumber(item.discountRate ?? item.discount_rate),
  })),
  subtotal: toNumber(invoice.subtotal),
  tax: toNumber(invoice.tax),
  total: toNumber(invoice.total),
  amountPaid: toNumber(invoice.amountPaid ?? invoice.amount_paid),
  balanceDue: toNumber(invoice.balanceDue ?? invoice.balance_due, toNumber(invoice.total)),
  baseSubtotal: toNumber(invoice.baseSubtotal ?? invoice.base_subtotal, toNumber(invoice.subtotal)),
  baseTax: toNumber(invoice.baseTax ?? invoice.base_tax, toNumber(invoice.tax)),
  baseTotal: toNumber(invoice.baseTotal ?? invoice.base_total, toNumber(invoice.total)),
  creditTotal: toNumber(invoice.creditTotal ?? invoice.credit_total),
  debitTotal: toNumber(invoice.debitTotal ?? invoice.debit_total),
  linkedDocuments: (invoice.linkedDocuments ?? invoice.linked_documents ?? []).map(document => ({
    id: String(document.id), invoiceNumber: 'invoiceNumber' in document ? document.invoiceNumber : document.invoice_number,
    documentType: 'documentType' in document ? document.documentType : document.document_type,
    status: document.status, date: document.date, total: toNumber(document.total),
  })),
  paymentHistory: (invoice.paymentHistory ?? invoice.payment_history ?? []).map((payment) => ({
    id: payment.id, amount: toNumber(payment.amount), paymentDate: 'paymentDate' in payment ? payment.paymentDate : payment.payment_date, reference: payment.reference,
    voidedAt: 'voidedAt' in payment ? payment.voidedAt : (payment as any).voided_at,
    updatedAt: 'updatedAt' in payment ? payment.updatedAt : (payment as any).updated_at,
  })),
  status: invoice.status ?? 'Draft',
  date: invoice.date ?? '',
  dueDate: invoice.dueDate ?? invoice.due_date ?? '',
  notes: invoice.notes ?? '',
  templateId: String(invoice.templateId ?? invoice.template_id ?? ''),
  category: invoice.category ?? 'general',
  documentType: invoice.documentType ?? invoice.document_type ?? 'standard_invoice',
  recurringInvoiceId: invoice.recurringInvoiceId ?? (invoice.recurring_invoice_id ? String(invoice.recurring_invoice_id) : undefined),
  templateSlug: invoice.templateSlug ?? invoice.template_slug ?? 'general-classic',
  templateVersion: toNumber(invoice.templateVersion ?? invoice.template_version, 1),
  metadata: typeof invoice.metadata === 'string' ? JSON.parse(invoice.metadata || '{}') : (invoice.metadata ?? {}),
  createdAt: invoice.createdAt ?? invoice.created_at ?? '',
});

interface UserDataExport {
  user: User;
  clients: Client[];
  products: Product[];
  invoices: Invoice[];
  templates: Template[];
  exported_at: string;
}

// ==================== Auth Services ====================

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      const response = await api.post<AuthResponse>('/login', { 
        email, 
        password
      });
      setToken(response.data.token);
      // Store user in localStorage for persistence across page reloads
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      return { user: response.data.user, token: response.data.token };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle 401 specifically with user-friendly message
        if (error.response?.status === 401) {
          throw new Error('Invalid credentials. Please check your email and password.');
        }
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> => {
    const response = await api.post<AuthResponse>('/register', {
      name,
      email,
      password,
      password_confirmation: password,
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
    const response = await api.get<User>('/user');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/profile', data);
    return response.data;
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

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/verify-email', { token });
  },

  resendVerification: async (): Promise<{ already_verified?: boolean; message?: string }> => {
    const response = await api.post('/resend-verification');
    return response.data?.data || response.data || {};
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
    const response = await api.get<PaginatedResponse<ApiClient>>('/clients');
    return Array.isArray(response.data.data) ? response.data.data.map(normalizeClient) : [];
  },

  getById: async (id: string | number): Promise<Client> => {
    const response = await api.get<ApiClient>(`/clients/${id}`);
    return normalizeClient(response.data);
  },

  create: async (data: Omit<Client, 'id' | 'userId' | 'createdAt'>): Promise<Client> => {
    const response = await api.post<ApiClient>('/clients', data);
    return normalizeClient(response.data);
  },

  update: async (id: string | number, data: Partial<Client>): Promise<Client> => {
    const response = await api.put<ApiClient>(`/clients/${id}`, data);
    return normalizeClient(response.data);
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

// ==================== Product Services ====================

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<PaginatedResponse<ApiProduct>>('/products');
    return Array.isArray(response.data.data) ? response.data.data.map(normalizeProduct) : [];
  },

  getById: async (id: string | number): Promise<Product> => {
    const response = await api.get<ApiProduct>(`/products/${id}`);
    return normalizeProduct(response.data);
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/products/categories');
    return response.data;
  },

  create: async (data: Omit<Product, 'id' | 'userId' | 'createdAt'>): Promise<Product> => {
    const response = await api.post<ApiProduct>('/products', serializeProduct(data));
    return normalizeProduct(response.data);
  },

  update: async (id: string | number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<ApiProduct>(`/products/${id}`, serializeProduct(data));
    return normalizeProduct(response.data);
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
  category?: string;
  document_type?: string;
  template_slug?: string;
  template_version?: number;
  metadata?: Record<string, string | number>;
  duplicate_confirmed?: boolean;
  items: Array<{
    product_id?: string | number;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    tax_rate: number;
    sku?: string; unit?: string; group_name?: string; discount_rate?: number;
  }>;
}

export const invoiceService = {
  getAll: async (): Promise<Invoice[]> => {
    const response = await api.get<PaginatedResponse<ApiInvoice>>('/invoices');
    return Array.isArray(response.data.data) ? response.data.data.map(normalizeInvoice) : [];
  },

  getById: async (id: string | number): Promise<Invoice> => {
    const response = await api.get<ApiInvoice>(`/invoices/${id}`);
    return normalizeInvoice(response.data);
  },

  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post<ApiInvoice>('/invoices', data);
    return normalizeInvoice(response.data);
  },

  update: async (id: string | number, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
    const response = await api.put<ApiInvoice>(`/invoices/${id}`, data);
    return normalizeInvoice(response.data);
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

  markPaid: async (id: string | number): Promise<Invoice> => {
    const response = await api.post<ApiInvoice>(`/invoices/${id}/mark-paid`);
    return normalizeInvoice(response.data);
  },
  recordPayment: async (id: string | number, data: { amount: number; payment_date: string; reference?: string; request_id?: string }): Promise<Invoice> => {
    const response = await api.post<ApiInvoice>(`/invoices/${id}/payments`, data);
    return normalizeInvoice(response.data);
  },
  issue: async (id: string | number): Promise<Invoice> => normalizeInvoice((await api.post<ApiInvoice>(`/invoices/${id}/issue`)).data),
  updatePayment: async (id: string | number, paymentId: string, data: { amount: number; payment_date: string; reference?: string }): Promise<Invoice> => normalizeInvoice((await api.put<ApiInvoice>(`/invoices/${id}/payments/${paymentId}`, data)).data),
  voidPayment: async (id: string | number, paymentId: string): Promise<Invoice> => normalizeInvoice((await api.delete<ApiInvoice>(`/invoices/${id}/payments/${paymentId}`)).data),
  getPdfBlob: async (id: string | number): Promise<Blob> => new Blob([(await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })).data], { type: 'application/pdf' }),
};

// ==================== Template Services ====================

export const templateService = {
  getAll: async (): Promise<Template[]> => {
    const response = await api.get<PaginatedResponse<ApiTemplate>>('/templates');
    return Array.isArray(response.data.data) ? response.data.data.map(normalizeTemplate) : [];
  },

  getById: async (id: string | number): Promise<Template> => {
    const response = await api.get<ApiTemplate>(`/templates/${id}`);
    return normalizeTemplate(response.data);
  },

  create: async (data: Omit<Template, 'id' | 'userId' | 'createdAt'>): Promise<Template> => {
    const response = await api.post<ApiTemplate>('/templates', serializeTemplate(data));
    return normalizeTemplate(response.data);
  },

  update: async (id: string | number, data: Partial<Template>): Promise<Template> => {
    const response = await api.put<ApiTemplate>(`/templates/${id}`, serializeTemplate(data));
    return normalizeTemplate(response.data);
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  setDefault: async (id: string | number): Promise<Template> => {
    const response = await api.post<ApiTemplate>(`/templates/${id}/set-default`);
    return normalizeTemplate(response.data);
  },
};

// ==================== Report Services ====================

export interface DashboardStats {
  total_revenue: number;
  outstanding: number;
  overdue_amount: number;
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
