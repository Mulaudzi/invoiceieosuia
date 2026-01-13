import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface RetryStatus {
  transaction_id: number;
  status: string;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  last_retry_at: string | null;
  failure_reason: string | null;
  grace_until: string | null;
}

interface ManualRetryResponse {
  success: boolean;
  message: string;
  next_retry: string | null;
}

export const useRetryStatus = (transactionId: number | null) => {
  return useQuery({
    queryKey: ['payment-retry', transactionId],
    queryFn: async (): Promise<RetryStatus> => {
      const response = await api.get('/payments/retry-status', {
        params: { transaction_id: transactionId }
      });
      return response.data;
    },
    enabled: !!transactionId,
  });
};

export const useManualRetry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: number): Promise<ManualRetryResponse> => {
      const response = await api.post('/payments/manual-retry', {
        transaction_id: transactionId
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-retry'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      if (data.success) {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
      } else {
        toast({
          title: "Retry Scheduled",
          description: data.next_retry 
            ? `We'll retry your payment on ${new Date(data.next_retry).toLocaleDateString()}`
            : "Your payment will be retried soon.",
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Retry Failed",
        description: error.response?.data?.message || "Unable to process payment retry",
        variant: "destructive",
      });
    },
  });
};

export const useRecordFailure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      failureReason 
    }: { 
      transactionId: number; 
      failureReason: string 
    }) => {
      const response = await api.post('/payments/record-failure', {
        transaction_id: transactionId,
        failure_reason: failureReason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-retry'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
};
