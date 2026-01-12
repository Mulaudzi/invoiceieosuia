import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface PayfastCheckoutResponse {
  success: boolean;
  payment_url: string;
  payment_id: string;
}

interface PayfastCheckoutParams {
  plan: 'solo' | 'pro' | 'business';
}

export const usePayfastCheckout = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ plan }: PayfastCheckoutParams) => {
      const response = await api.post<PayfastCheckoutResponse>('/payfast/checkout', { plan });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to PayFast checkout
      window.location.href = data.payment_url;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.response?.data?.message || "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });
};

export const usePayfastStatus = () => {
  const queryClient = useQueryClient();

  const checkPaymentStatus = (status: string, plan?: string) => {
    if (status === 'success' && plan) {
      // Invalidate user data to refresh plan
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      return { success: true, plan };
    }
    return { success: false };
  };

  return { checkPaymentStatus };
};
