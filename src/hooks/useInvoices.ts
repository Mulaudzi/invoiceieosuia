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
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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

export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => invoiceService.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    },
  });
};

export const useRecordInvoicePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, paymentDate, reference, requestId }: { id: string | number; amount: number; paymentDate: string; reference?: string; requestId?: string }) =>
      invoiceService.recordPayment(id, { amount, payment_date: paymentDate, reference, request_id: requestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

const useInvoiceLedgerMutation = <T,>(mutationFn: (variables: T) => Promise<Invoice>) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  }});
};

export const useIssueInvoice = () => useInvoiceLedgerMutation((id: string | number) => invoiceService.issue(id));
export const useUpdateInvoicePayment = () => useInvoiceLedgerMutation(({ id, paymentId, amount, paymentDate, reference }: { id: string | number; paymentId: string; amount: number; paymentDate: string; reference?: string }) => invoiceService.updatePayment(id, paymentId, { amount, payment_date: paymentDate, reference }));
export const useVoidInvoicePayment = () => useInvoiceLedgerMutation(({ id, paymentId }: { id: string | number; paymentId: string }) => invoiceService.voidPayment(id, paymentId));
