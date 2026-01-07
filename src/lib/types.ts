// Core types for the invoicing app

export type PlanType = 'free' | 'pro' | 'business';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  plan: PlanType;
  businessName?: string;
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
  quantity: number;
  price: number;
  taxRate: number;
}

export type InvoiceStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  method: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'PayPal' | 'Other';
  date: string;
  createdAt: string;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
}
