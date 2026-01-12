import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface RecurringInvoice {
  id: number;
  user_id: number;
  client_id: number;
  client_name: string;
  template_id: number | null;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_invoice_date: string;
  last_generated_at: string | null;
  total_generated: number;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  terms: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  items: RecurringInvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface RecurringInvoiceItem {
  id: number;
  recurring_invoice_id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreateRecurringInvoiceData {
  client_id: number;
  template_id?: number;
  description: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  terms?: string;
  items: Array<{
    product_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const useRecurringInvoices = () => {
  return useQuery({
    queryKey: ['recurring-invoices'],
    queryFn: async () => {
      const response = await api.get<{ data: RecurringInvoice[] }>('/recurring-invoices');
      return response.data.data;
    },
  });
};

export const useRecurringInvoice = (id: number) => {
  return useQuery({
    queryKey: ['recurring-invoices', id],
    queryFn: async () => {
      const response = await api.get<{ data: RecurringInvoice }>(`/recurring-invoices/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateRecurringInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateRecurringInvoiceData) => {
      const response = await api.post('/recurring-invoices', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
  });
};

export const useUpdateRecurringInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateRecurringInvoiceData> }) => {
      const response = await api.put(`/recurring-invoices/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices', variables.id] });
    },
  });
};

export const useDeleteRecurringInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/recurring-invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
  });
};

export const useToggleRecurringStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await api.patch(`/recurring-invoices/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
  });
};

export const useGenerateRecurringInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/recurring-invoices/${id}/generate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};