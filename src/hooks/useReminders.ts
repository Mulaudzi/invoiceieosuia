import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Reminder {
  id: number;
  invoice_id: number;
  invoice_number: string;
  client_name: string;
  total: number;
  due_date: string;
  reminder_type: 'before_due' | 'on_due' | 'after_due';
  days_offset: number;
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error_message: string | null;
}

export interface ReminderSettings {
  enabled: boolean;
  before_due_days: number;
  on_due: boolean;
  after_due_days: number[];
  auto_schedule: boolean;
}

export const useReminders = () => {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const response = await api.get<{ data: Reminder[] }>('/reminders');
      return response.data.data;
    },
  });
};

export const useCreateReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { invoice_id: number; reminder_type: string; days_offset: number }) => {
      const response = await api.post('/reminders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useDeleteReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useScheduleReminders = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, reminders }: { 
      invoiceId: number; 
      reminders?: Array<{ type: string; days: number }> 
    }) => {
      const response = await api.post(`/invoices/${invoiceId}/reminders`, { reminders });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useReminderSettings = () => {
  return useQuery({
    queryKey: ['reminder-settings'],
    queryFn: async () => {
      const response = await api.get<{ settings: ReminderSettings }>('/reminders/settings');
      return response.data.settings;
    },
  });
};

export const useUpdateReminderSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<ReminderSettings>) => {
      const response = await api.put('/reminders/settings', { settings });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
    },
  });
};
