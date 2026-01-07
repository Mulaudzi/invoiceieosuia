import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, CreateInvoiceData } from '@/services/api';
import { Invoice } from '@/lib/types';

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAll,
  });
};

export const useInvoice = (id: string | number) => {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateInvoiceData) => invoiceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<CreateInvoiceData> }) => 
      invoiceService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => invoiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDownloadInvoicePdf = () => {
  return useMutation({
    mutationFn: (id: string | number) => invoiceService.downloadPdf(id),
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, message }: { id: string | number; message?: string }) => 
      invoiceService.send(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => invoiceService.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
