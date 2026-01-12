import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  generateCsv,
  downloadCsv,
  generateTextReport,
  downloadTextFile,
  isFreePlan,
  formatCurrencyForExport,
  formatDateForExport,
} from '@/lib/exportUtils';
import { reportService } from '@/services/api';

interface ExportOptions {
  title: string;
  filename: string;
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
}

export const useExport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isFree = isFreePlan(user);

  const exportToCsv = (options: ExportOptions) => {
    try {
      const csvContent = generateCsv(
        options.data,
        options.columns,
        user,
        options.title
      );
      downloadCsv(csvContent, options.filename);
      
      toast({
        title: 'Export successful',
        description: isFree 
          ? 'CSV exported with IEOSUIA branding. Upgrade to remove branding.'
          : 'Your CSV file has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data.',
        variant: 'destructive',
      });
    }
  };

  const exportToText = (options: ExportOptions) => {
    try {
      const textContent = generateTextReport(
        options.data,
        options.columns,
        user,
        options.title
      );
      downloadTextFile(textContent, options.filename);
      
      toast({
        title: 'Export successful',
        description: isFree 
          ? 'Report exported with IEOSUIA branding. Upgrade to remove branding.'
          : 'Your report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data.',
        variant: 'destructive',
      });
    }
  };

  const exportToPdf = async (reportType: string) => {
    try {
      await reportService.exportReport('pdf', reportType);
      toast({
        title: 'PDF Export successful',
        description: isFree 
          ? 'PDF exported with IEOSUIA branding. Upgrade to remove branding.'
          : 'Your PDF has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting to PDF.',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = async (reportType: string) => {
    try {
      await reportService.exportReport('excel', reportType);
      toast({
        title: 'Excel Export successful',
        description: isFree 
          ? 'Excel exported with IEOSUIA branding. Upgrade to remove branding.'
          : 'Your Excel file has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting to Excel.',
        variant: 'destructive',
      });
    }
  };

  return {
    exportToCsv,
    exportToText,
    exportToPdf,
    exportToExcel,
    isFree,
    formatCurrencyForExport,
    formatDateForExport,
  };
};
