import { useMutation } from '@tanstack/react-query';
import { notificationService } from '@/services/api';

export const useSendSms = () => {
  return useMutation({
    mutationFn: ({ invoiceId, message }: { invoiceId: string | number; message: string }) =>
      notificationService.sendSms(invoiceId, message),
  });
};
