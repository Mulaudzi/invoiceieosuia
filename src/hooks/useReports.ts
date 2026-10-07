import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/api';
import type { ReportDateRange } from '@/lib/reportDateRange';

export const useDashboardStats = (range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'dashboard', range],
    queryFn: () => reportService.getDashboard(range),
  });
};

export const useExtendedStats = (range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'extended-stats', range],
    queryFn: () => reportService.getExtendedStats(range),
  });
};

export const useMonthlyRevenue = (range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'monthly-revenue', range],
    queryFn: () => reportService.getMonthlyRevenue(range),
  });
};

export const useMonthlyStats = (range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'monthly-stats', range],
    queryFn: () => reportService.getMonthlyStats(range),
  });
};

export const useInvoiceStatus = (range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'invoice-status', range],
    queryFn: () => reportService.getInvoiceStatus(range),
  });
};

export const useTopClients = (limit?: number, range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'top-clients', limit, range],
    queryFn: () => reportService.getTopClients(limit, range),
  });
};

export const useIncomeExpense = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['reports', 'income-expense', startDate, endDate],
    queryFn: () => reportService.getIncomeExpense(startDate, endDate),
  });
};

export const useRecentInvoices = (limit?: number, range?: ReportDateRange) => {
  return useQuery({
    queryKey: ['reports', 'recent-invoices', limit, range],
    queryFn: () => reportService.getRecentInvoices(limit, range),
  });
};
