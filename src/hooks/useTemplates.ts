import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '@/services/api';
import { Template } from '@/lib/types';

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: templateService.getAll,
  });
};

export const useTemplate = (id: string | number) => {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => templateService.getById(id),
    enabled: !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Template, 'id' | 'userId' | 'createdAt'>) => templateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Template> }) => 
      templateService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates', variables.id] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => templateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useSetDefaultTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => templateService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};
