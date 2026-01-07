import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: reportService.getDashboard,
  });
};

export const useMonthlyRevenue = (year?: number) => {
  return useQuery({
    queryKey: ['reports', 'monthly-revenue', year],
    queryFn: () => reportService.getMonthlyRevenue(year),
  });
};

export const useInvoiceStatus = () => {
  return useQuery({
    queryKey: ['reports', 'invoice-status'],
    queryFn: reportService.getInvoiceStatus,
  });
};

export const useTopClients = (limit?: number) => {
  return useQuery({
    queryKey: ['reports', 'top-clients', limit],
    queryFn: () => reportService.getTopClients(limit),
  });
};

export const useIncomeExpense = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['reports', 'income-expense', startDate, endDate],
    queryFn: () => reportService.getIncomeExpense(startDate, endDate),
  });
};

export const useRecentInvoices = (limit?: number) => {
  return useQuery({
    queryKey: ['reports', 'recent-invoices', limit],
    queryFn: () => reportService.getRecentInvoices(limit),
  });
};
