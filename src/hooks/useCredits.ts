import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface CreditUsage {
  plan: string;
  credits: {
    email: {
      total: number;
      used: number;
      remaining: number;
      monthly_limit: number;
    };
    sms: {
      total: number;
      used: number;
      remaining: number;
      monthly_limit: number;
    };
    invoices: {
      used: number;
      limit: number | null;
      unlimited: boolean;
    };
  };
  reset_date: string;
  days_until_reset: number;
  features: {
    custom_branding: boolean;
    auto_reminders: boolean;
    advanced_reports: boolean;
    multi_user: number;
    priority_support: boolean;
  };
  monthly_price: number;
  activity: Array<{
    type: string;
    count: number;
    date: string;
  }>;
}

export interface PlanInfo {
  plan_name: string;
  monthly_price: number;
  email_credits_monthly: number;
  sms_credits_monthly: number;
  invoices_monthly: number | null;
  custom_branding: boolean;
  auto_reminders: boolean;
  advanced_reports: boolean;
  multi_user: number;
  priority_support: boolean;
}

export interface NotificationLog {
  id: number;
  type: 'email' | 'sms';
  recipient: string;
  subject: string | null;
  invoice_id: number | null;
  invoice_number: string | null;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  credits_used: number;
  created_at: string;
}

export const useCredits = () => {
  return useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      const response = await api.get<CreditUsage>('/credits/usage');
      return response.data;
    },
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await api.get<{ data: PlanInfo[] }>('/credits/plans');
      return response.data.data;
    },
  });
};

export const useNotificationLogs = (type?: 'email' | 'sms') => {
  return useQuery({
    queryKey: ['notification-logs', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const response = await api.get<{ data: NotificationLog[] }>(`/credits/logs${params}`);
      return response.data.data;
    },
    refetchOnWindowFocus: true,
  });
};

export const useCheckCredits = () => {
  return useMutation({
    mutationFn: async ({ type, count = 1 }: { type: 'email' | 'sms'; count?: number }) => {
      const response = await api.get(`/credits/check?type=${type}&count=${count}`);
      return response.data;
    },
  });
};

export const useConsumeCredits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ type, count = 1 }: { type: 'email' | 'sms'; count?: number }) => {
      const response = await api.post('/credits/use', { type, count });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
  });
};
