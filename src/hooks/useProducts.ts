import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/api';
import { Product } from '@/lib/types';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });
};

export const useProduct = (id: string | number) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
};

export const useProductCategories = () => {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: productService.getCategories,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'userId' | 'createdAt'>) => productService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Product> }) => 
      productService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
