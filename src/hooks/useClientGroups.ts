import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientGroupService, ClientGroup, CreateClientGroupData } from '@/services/clientGroupService';

export const useClientGroups = () => {
  return useQuery({
    queryKey: ['clientGroups'],
    queryFn: clientGroupService.getAll,
  });
};

export const useClientGroup = (id: number) => {
  return useQuery({
    queryKey: ['clientGroups', id],
    queryFn: () => clientGroupService.getById(id),
    enabled: !!id,
  });
};

export const useCreateClientGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateClientGroupData) => clientGroupService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
    },
  });
};

export const useUpdateClientGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateClientGroupData> }) => 
      clientGroupService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
      queryClient.invalidateQueries({ queryKey: ['clientGroups', variables.id] });
    },
  });
};

export const useDeleteClientGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => clientGroupService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
    },
  });
};

export const useAssignClientsToGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, clientIds }: { groupId: number; clientIds: number[] }) => 
      clientGroupService.assignClients(groupId, clientIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useRemoveClientsFromGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, clientIds }: { groupId: number; clientIds: number[] }) => 
      clientGroupService.removeClients(groupId, clientIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
