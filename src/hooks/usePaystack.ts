import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface PaystackInitializeResponse {
  success: boolean;
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyResponse {
  success: boolean;
  status: string;
  amount: number;
  reference: string;
}

interface PaystackConfig {
  public_key: string;
}

export const usePaystackConfig = () => {
  return useQuery({
    queryKey: ['paystack-config'],
    queryFn: async () => {
      const response = await api.get<PaystackConfig>('/paystack/config');
      return response.data;
    },
    staleTime: Infinity,
  });
};

export const usePaystackInitialize = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ invoiceId, amount, callbackUrl }: { 
      invoiceId: string | number; 
      amount: number;
      callbackUrl?: string;
    }) => {
      const response = await api.post<PaystackInitializeResponse>('/paystack/initialize', {
        invoice_id: invoiceId,
        amount,
        callback_url: callbackUrl,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.response?.data?.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });
};

export const usePaystackVerify = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: string) => {
      const response = await api.get<PaystackVerifyResponse>(`/paystack/verify/${reference}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        toast({
          title: "Payment Successful",
          description: `Payment of R${data.amount.toFixed(2)} has been recorded`,
        });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Failed to verify payment",
        variant: "destructive",
      });
    },
  });
};

export const usePayfastInvoice = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ invoiceId, amount }: { invoiceId: string | number; amount: number }) => {
      const response = await api.post<{ success: boolean; payment_url: string; payment_id: string }>(
        '/payfast/invoice',
        { invoice_id: invoiceId, amount }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to PayFast checkout
      window.location.href = data.payment_url;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.response?.data?.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });
};
