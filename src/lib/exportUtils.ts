import { User } from '@/lib/types';

const BRANDING_TEXT = 'Powered by IEOSUIA - Professional Invoicing';
const BRANDING_URL = 'https://ieosuia.com';

// Check if user is on a free plan
export const isFreePlan = (user: User | null): boolean => {
  return !user?.plan || user.plan === 'free';
};

// Convert data to CSV string with optional branding
export const generateCsv = (
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  user: User | null,
  title?: string
): string => {
  const isFree = isFreePlan(user);
  const lines: string[] = [];

  // Add branding header for free users
  if (isFree) {
    lines.push(`"${BRANDING_TEXT}"`);
    lines.push(`"${BRANDING_URL}"`);
    lines.push('');
  }

  // Add title if provided
  if (title) {
    lines.push(`"${title}"`);
    lines.push(`"Generated: ${new Date().toLocaleDateString('en-ZA')}"`);
    lines.push('');
  }

  // Add column headers
  lines.push(columns.map(col => `"${col.label}"`).join(','));

  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    });
    lines.push(values.join(','));
  });

  // Add footer branding for free users
  if (isFree) {
    lines.push('');
    lines.push(`"${BRANDING_TEXT}"`);
  }

  return lines.join('\n');
};

// Download CSV file
export const downloadCsv = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Generate simple PDF-like text export (for client-side)
export const generateTextReport = (
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  user: User | null,
  title: string
): string => {
  const isFree = isFreePlan(user);
  const lines: string[] = [];
  const divider = '═'.repeat(60);
  const thinDivider = '─'.repeat(60);

  // Add branding header for free users
  if (isFree) {
    lines.push(divider);
    lines.push(BRANDING_TEXT.toUpperCase());
    lines.push(BRANDING_URL);
    lines.push(divider);
    lines.push('');
  }

  // Title
  lines.push(title.toUpperCase());
  lines.push(`Generated: ${new Date().toLocaleDateString('en-ZA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`);
  lines.push(thinDivider);
  lines.push('');

  // Column headers
  const headerRow = columns.map(col => col.label.padEnd(20)).join(' | ');
  lines.push(headerRow);
  lines.push(thinDivider);

  // Data rows
  data.forEach(row => {
    const rowValues = columns.map(col => {
      const value = row[col.key];
      const strValue = value === null || value === undefined ? '-' : String(value);
      return strValue.substring(0, 20).padEnd(20);
    });
    lines.push(rowValues.join(' | '));
  });

  lines.push('');
  lines.push(thinDivider);
  lines.push(`Total Records: ${data.length}`);

  // Add footer branding for free users
  if (isFree) {
    lines.push('');
    lines.push(divider);
    lines.push(BRANDING_TEXT);
    lines.push('Upgrade to a paid plan to remove branding');
    lines.push(divider);
  }

  return lines.join('\n');
};

// Download text file
export const downloadTextFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.txt`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Invoice export columns
export const invoiceColumns = [
  { key: 'id', label: 'Invoice #' },
  { key: 'clientName', label: 'Client' },
  { key: 'clientEmail', label: 'Email' },
  { key: 'total', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'dueDate', label: 'Due Date' },
];

// Report export columns
export const reportColumns = {
  revenue: [
    { key: 'month', label: 'Month' },
    { key: 'revenue', label: 'Revenue' },
  ],
  clients: [
    { key: 'name', label: 'Client' },
    { key: 'revenue', label: 'Total Revenue' },
    { key: 'invoices', label: 'Invoices' },
  ],
  status: [
    { key: 'status', label: 'Status' },
    { key: 'count', label: 'Count' },
  ],
};

// Format currency for exports
export const formatCurrencyForExport = (amount: number): string => {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
};

// Format date for exports
export const formatDateForExport = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-ZA');
};
