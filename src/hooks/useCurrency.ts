import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { ExchangeRate } from '@/lib/currencies';

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

interface RatesResponse {
  base: string;
  rates: Record<string, { rate: number; updatedAt: string }>;
}

interface ConversionResponse {
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  rate: number;
}

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const response = await api.get<{ currencies: CurrencyInfo[] }>('/currencies');
      return response.data.currencies;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useExchangeRates = (baseCurrency: string = 'ZAR') => {
  return useQuery({
    queryKey: ['exchange-rates', baseCurrency],
    queryFn: async () => {
      const response = await api.get<RatesResponse>('/currencies/rates', {
        params: { base: baseCurrency },
      });
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useConvertCurrency = () => {
  return useMutation({
    mutationFn: async ({ amount, from, to }: { amount: number; from: string; to: string }) => {
      const response = await api.post<ConversionResponse>('/currencies/convert', {
        amount,
        from,
        to,
      });
      return response.data;
    },
  });
};

export const useUpdateExchangeRates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/currencies/update-rates');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
  });
};
