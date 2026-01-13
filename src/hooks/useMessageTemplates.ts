import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageTemplateService, MessageTemplate, EmailTemplateData, SmsTemplateData } from '@/services/messageTemplateService';

export const useMessageTemplates = (type?: 'email' | 'sms') => {
  return useQuery({
    queryKey: ['messageTemplates', type],
    queryFn: () => messageTemplateService.getAll(type),
  });
};

export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ['messageTemplates', 'email'],
    queryFn: messageTemplateService.getEmailTemplates,
  });
};

export const useSmsTemplates = () => {
  return useQuery({
    queryKey: ['messageTemplates', 'sms'],
    queryFn: messageTemplateService.getSmsTemplates,
  });
};

export const useMessageTemplate = (id: number) => {
  return useQuery({
    queryKey: ['messageTemplates', 'single', id],
    queryFn: () => messageTemplateService.getById(id),
    enabled: !!id,
  });
};

export const useSaveEmailTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: EmailTemplateData) => messageTemplateService.saveEmailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
    },
  });
};

export const useSaveSmsTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SmsTemplateData) => messageTemplateService.saveSmsTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
    },
  });
};

export const useUpdateMessageTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MessageTemplate> }) => 
      messageTemplateService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['messageTemplates', 'single', variables.id] });
    },
  });
};

export const useDeleteMessageTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => messageTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
    },
  });
};

export const useResetMessageTemplates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (type: 'email' | 'sms') => messageTemplateService.resetToDefaults(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
    },
  });
};
