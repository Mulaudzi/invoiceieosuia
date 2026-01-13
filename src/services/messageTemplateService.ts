import api from './api';

export interface MessageTemplate {
  id?: number;
  user_id?: number;
  name: string;
  type: 'email' | 'sms';
  category: 'invoice' | 'reminder' | 'overdue' | 'thank_you';
  subject?: string;
  content: string;
  is_default?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailTemplateData {
  name?: string;
  category: string;
  subject: string;
  content: string;
  is_default?: boolean;
}

export interface SmsTemplateData {
  name?: string;
  category: string;
  content: string;
  is_default?: boolean;
}

export const messageTemplateService = {
  getAll: async (type?: 'email' | 'sms'): Promise<MessageTemplate[]> => {
    const params = type ? { type } : {};
    const response = await api.get('/message-templates', { params });
    return response.data;
  },

  getEmailTemplates: async (): Promise<MessageTemplate[]> => {
    const response = await api.get('/message-templates/email');
    return response.data;
  },

  getSmsTemplates: async (): Promise<MessageTemplate[]> => {
    const response = await api.get('/message-templates/sms');
    return response.data;
  },

  saveEmailTemplate: async (data: EmailTemplateData): Promise<MessageTemplate> => {
    const response = await api.post('/message-templates/email', data);
    return response.data;
  },

  saveSmsTemplate: async (data: SmsTemplateData): Promise<MessageTemplate> => {
    const response = await api.post('/message-templates/sms', data);
    return response.data;
  },

  getById: async (id: number): Promise<MessageTemplate> => {
    const response = await api.get(`/message-templates/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<MessageTemplate>): Promise<MessageTemplate> => {
    const response = await api.put(`/message-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/message-templates/${id}`);
  },

  resetToDefaults: async (type: 'email' | 'sms'): Promise<void> => {
    await api.post('/message-templates/reset', { type });
  },
};
