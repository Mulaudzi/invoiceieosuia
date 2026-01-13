import api from './api';

export interface ClientGroup {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'inactive';
  client_count?: number;
  clients?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateClientGroupData {
  name: string;
  description?: string;
  color?: string;
  status?: 'active' | 'inactive';
}

export const clientGroupService = {
  getAll: async (): Promise<ClientGroup[]> => {
    const response = await api.get('/client-groups');
    return response.data;
  },

  getById: async (id: number): Promise<ClientGroup> => {
    const response = await api.get(`/client-groups/${id}`);
    return response.data;
  },

  create: async (data: CreateClientGroupData): Promise<ClientGroup> => {
    const response = await api.post('/client-groups', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateClientGroupData>): Promise<ClientGroup> => {
    const response = await api.put(`/client-groups/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/client-groups/${id}`);
  },

  assignClients: async (groupId: number, clientIds: number[]): Promise<ClientGroup> => {
    const response = await api.post(`/client-groups/${groupId}/assign`, { client_ids: clientIds });
    return response.data;
  },

  removeClients: async (groupId: number, clientIds: number[]): Promise<ClientGroup> => {
    const response = await api.post(`/client-groups/${groupId}/remove`, { client_ids: clientIds });
    return response.data;
  },
};
