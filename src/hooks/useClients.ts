import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/services/api';
import { Client } from '@/lib/types';

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });
};

export const useClient = (id: string | number) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'userId' | 'createdAt'>) => clientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Client> }) => 
      clientService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => clientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
