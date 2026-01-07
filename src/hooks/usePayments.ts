import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/api';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: paymentService.getAll,
  });
};

export const usePaymentSummary = () => {
  return useQuery({
    queryKey: ['payments', 'summary'],
    queryFn: paymentService.getSummary,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      invoice_id: string | number;
      amount: number;
      method: string;
      date: string;
      notes?: string;
    }) => paymentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => paymentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
