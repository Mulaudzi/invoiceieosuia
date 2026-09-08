// Core types for the invoicing app

export type PlanType = 'free';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  plan: PlanType;
  businessName?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  registrationNumber?: string;
  website?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchCode?: string;
  swiftCode?: string;
  paymentInstructions?: string;
  logoPath?: string;
  logo_path?: string;
  avatar?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  price: number;
  taxRate: number;
  category: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  group?: string;
  quantity: number;
  price: number;
  taxRate: number;
  discountRate?: number;
}

export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Pending' | 'Partially Paid' | 'Paid' | 'Applied' | 'Overdue' | 'Cancelled' | 'Voided';

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentDate: string;
  reference?: string;
  voidedAt?: string;
  updatedAt?: string;
}

export interface LinkedInvoiceDocument {
  id: string;
  invoiceNumber: string;
  documentType: string;
  status: InvoiceStatus;
  date: string;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  baseSubtotal?: number;
  baseTax?: number;
  baseTotal?: number;
  creditTotal?: number;
  debitTotal?: number;
  linkedDocuments?: LinkedInvoiceDocument[];
  paymentHistory: InvoicePayment[];
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  notes?: string;
  templateId?: string;
  category?: string;
  documentType?: string;
  recurringInvoiceId?: string;
  templateSlug?: string;
  templateVersion?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TemplateStyles {
  primaryColor: string;
  accentColor: string;
  fontFamily: 'inter' | 'poppins' | 'roboto' | 'opensans' | 'lato';
  headerStyle: 'left' | 'center' | 'right';
  showLogo: boolean;
  showBorder: boolean;
  showWatermark: boolean;
  tableStyle: 'striped' | 'bordered' | 'minimal';
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  description: string;
  isDefault: boolean;
  styles: TemplateStyles;
  createdAt: string;
}

export const defaultTemplateStyles: TemplateStyles = {
  primaryColor: '#2563eb',
  accentColor: '#10b981',
  fontFamily: 'inter',
  headerStyle: 'left',
  showLogo: true,
  showBorder: true,
  showWatermark: false,
  tableStyle: 'striped',
};
