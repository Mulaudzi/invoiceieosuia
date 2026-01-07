import { User, Client, Product, Invoice, Payment, Template } from './types';

// Generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 15);

// Storage keys
export const STORAGE_KEYS = {
  USERS: 'ieosuia_users',
  CURRENT_USER: 'ieosuia_current_user',
  CLIENTS: 'ieosuia_clients',
  PRODUCTS: 'ieosuia_products',
  INVOICES: 'ieosuia_invoices',
  PAYMENTS: 'ieosuia_payments',
  TEMPLATES: 'ieosuia_templates',
  INITIALIZED: 'ieosuia_initialized',
};

// Seed data
const seedUsers: User[] = [
  {
    id: 'user_demo',
    name: 'Demo User',
    email: 'demo@ieosuia.com',
    password: 'demo123',
    plan: 'pro',
    businessName: 'Demo Business',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const seedClients: Client[] = [
  { id: 'client_1', userId: 'user_demo', name: 'Acme Corp', email: 'billing@acme.com', phone: '+27 11 123 4567', company: 'Acme Corporation', status: 'Active', createdAt: '2024-01-05T00:00:00.000Z' },
  { id: 'client_2', userId: 'user_demo', name: 'TechStart Inc', email: 'finance@techstart.io', phone: '+27 21 234 5678', company: 'TechStart Inc', status: 'Active', createdAt: '2024-01-06T00:00:00.000Z' },
  { id: 'client_3', userId: 'user_demo', name: 'Global Solutions', email: 'ap@globalsolutions.com', phone: '+27 12 345 6789', company: 'Global Solutions Ltd', status: 'Active', createdAt: '2024-01-07T00:00:00.000Z' },
  { id: 'client_4', userId: 'user_demo', name: 'Creative Agency', email: 'admin@creative.co', phone: '+27 31 456 7890', company: 'Creative Agency Co', status: 'Active', createdAt: '2024-01-08T00:00:00.000Z' },
  { id: 'client_5', userId: 'user_demo', name: 'DataFlow Ltd', email: 'accounts@dataflow.io', phone: '+27 41 567 8901', company: 'DataFlow Limited', status: 'Inactive', createdAt: '2024-01-09T00:00:00.000Z' },
];

const seedProducts: Product[] = [
  { id: 'prod_1', userId: 'user_demo', name: 'Web Development', description: 'Full-stack web development services', price: 15000, taxRate: 15, category: 'Services', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'prod_2', userId: 'user_demo', name: 'UI/UX Design', description: 'User interface and experience design', price: 8500, taxRate: 15, category: 'Services', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'prod_3', userId: 'user_demo', name: 'Consulting', description: 'Business and technical consulting', price: 2500, taxRate: 15, category: 'Services', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'prod_4', userId: 'user_demo', name: 'Monthly Retainer', description: 'Monthly support and maintenance', price: 12000, taxRate: 15, category: 'Subscription', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'prod_5', userId: 'user_demo', name: 'Training Session', description: 'Technical training session (2 hours)', price: 3500, taxRate: 15, category: 'Training', createdAt: '2024-01-01T00:00:00.000Z' },
];

const seedInvoices: Invoice[] = [
  { id: 'INV-001', userId: 'user_demo', clientId: 'client_1', clientName: 'Acme Corp', clientEmail: 'billing@acme.com', items: [{ productId: 'prod_1', name: 'Web Development', quantity: 2, price: 15000, taxRate: 15 }], subtotal: 30000, tax: 4500, total: 34500, status: 'Paid', date: '2024-01-15', dueDate: '2024-02-15', createdAt: '2024-01-15T00:00:00.000Z' },
  { id: 'INV-002', userId: 'user_demo', clientId: 'client_2', clientName: 'TechStart Inc', clientEmail: 'finance@techstart.io', items: [{ productId: 'prod_2', name: 'UI/UX Design', quantity: 3, price: 8500, taxRate: 15 }], subtotal: 25500, tax: 3825, total: 29325, status: 'Pending', date: '2024-01-14', dueDate: '2024-02-14', createdAt: '2024-01-14T00:00:00.000Z' },
  { id: 'INV-003', userId: 'user_demo', clientId: 'client_3', clientName: 'Global Solutions', clientEmail: 'ap@globalsolutions.com', items: [{ productId: 'prod_4', name: 'Monthly Retainer', quantity: 4, price: 12000, taxRate: 15 }], subtotal: 48000, tax: 7200, total: 55200, status: 'Overdue', date: '2024-01-10', dueDate: '2024-01-25', createdAt: '2024-01-10T00:00:00.000Z' },
  { id: 'INV-004', userId: 'user_demo', clientId: 'client_4', clientName: 'Creative Agency', clientEmail: 'admin@creative.co', items: [{ productId: 'prod_3', name: 'Consulting', quantity: 6, price: 2500, taxRate: 15 }], subtotal: 15000, tax: 2250, total: 17250, status: 'Paid', date: '2024-01-08', dueDate: '2024-02-08', createdAt: '2024-01-08T00:00:00.000Z' },
  { id: 'INV-005', userId: 'user_demo', clientId: 'client_5', clientName: 'DataFlow Ltd', clientEmail: 'accounts@dataflow.io', items: [{ productId: 'prod_1', name: 'Web Development', quantity: 4, price: 15000, taxRate: 15 }, { productId: 'prod_5', name: 'Training Session', quantity: 2, price: 3500, taxRate: 15 }], subtotal: 67000, tax: 10050, total: 77050, status: 'Pending', date: '2024-01-05', dueDate: '2024-02-05', createdAt: '2024-01-05T00:00:00.000Z' },
  { id: 'INV-006', userId: 'user_demo', clientId: 'client_1', clientName: 'Acme Corp', clientEmail: 'billing@acme.com', items: [{ productId: 'prod_2', name: 'UI/UX Design', quantity: 2, price: 8500, taxRate: 15 }], subtotal: 17000, tax: 2550, total: 19550, status: 'Draft', date: '2024-01-04', dueDate: '2024-02-04', createdAt: '2024-01-04T00:00:00.000Z' },
  { id: 'INV-007', userId: 'user_demo', clientId: 'client_2', clientName: 'TechStart Inc', clientEmail: 'finance@techstart.io', items: [{ productId: 'prod_4', name: 'Monthly Retainer', quantity: 10, price: 12000, taxRate: 15 }], subtotal: 120000, tax: 18000, total: 138000, status: 'Paid', date: '2024-01-02', dueDate: '2024-02-02', createdAt: '2024-01-02T00:00:00.000Z' },
  { id: 'INV-008', userId: 'user_demo', clientId: 'client_3', clientName: 'Global Solutions', clientEmail: 'ap@globalsolutions.com', items: [{ productId: 'prod_3', name: 'Consulting', quantity: 4, price: 2500, taxRate: 15 }], subtotal: 10000, tax: 1500, total: 11500, status: 'Pending', date: '2024-01-01', dueDate: '2024-02-01', createdAt: '2024-01-01T00:00:00.000Z' },
];

const seedPayments: Payment[] = [
  { id: 'pay_1', userId: 'user_demo', invoiceId: 'INV-001', invoiceNumber: 'INV-001', clientName: 'Acme Corp', amount: 34500, method: 'Bank Transfer', date: '2024-01-20', createdAt: '2024-01-20T00:00:00.000Z' },
  { id: 'pay_2', userId: 'user_demo', invoiceId: 'INV-004', invoiceNumber: 'INV-004', clientName: 'Creative Agency', amount: 17250, method: 'Credit Card', date: '2024-01-15', createdAt: '2024-01-15T00:00:00.000Z' },
  { id: 'pay_3', userId: 'user_demo', invoiceId: 'INV-007', invoiceNumber: 'INV-007', clientName: 'TechStart Inc', amount: 138000, method: 'Bank Transfer', date: '2024-01-10', createdAt: '2024-01-10T00:00:00.000Z' },
];

const seedTemplates: Template[] = [
  { id: 'tpl_1', userId: 'user_demo', name: 'Standard Invoice', description: 'Clean, professional invoice template', isDefault: true, createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'tpl_2', userId: 'user_demo', name: 'Modern Blue', description: 'Blue-themed modern design', isDefault: false, createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'tpl_3', userId: 'user_demo', name: 'Minimal', description: 'Ultra-minimal invoice layout', isDefault: false, createdAt: '2024-01-01T00:00:00.000Z' },
];

// Initialize mock data
export function initializeMockData(): void {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) return;

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(seedClients));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(seedInvoices));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(seedPayments));
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(seedTemplates));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// Generic localStorage helpers
function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// User service
export const userService = {
  getAll: (): User[] => getItems<User>(STORAGE_KEYS.USERS),
  
  getByEmail: (email: string): User | undefined => {
    return getItems<User>(STORAGE_KEYS.USERS).find(u => u.email === email);
  },
  
  create: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = getItems<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setItems(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  
  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
};

// Client service
export const clientService = {
  getAll: (userId: string): Client[] => {
    return getItems<Client>(STORAGE_KEYS.CLIENTS).filter(c => c.userId === userId);
  },
  
  getById: (id: string): Client | undefined => {
    return getItems<Client>(STORAGE_KEYS.CLIENTS).find(c => c.id === id);
  },
  
  create: (client: Omit<Client, 'id' | 'createdAt'>): Client => {
    const clients = getItems<Client>(STORAGE_KEYS.CLIENTS);
    const newClient: Client = {
      ...client,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    setItems(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  },
  
  update: (id: string, data: Partial<Client>): Client | undefined => {
    const clients = getItems<Client>(STORAGE_KEYS.CLIENTS);
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    clients[index] = { ...clients[index], ...data };
    setItems(STORAGE_KEYS.CLIENTS, clients);
    return clients[index];
  },
  
  delete: (id: string): boolean => {
    const clients = getItems<Client>(STORAGE_KEYS.CLIENTS);
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    setItems(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  },
};

// Product service
export const productService = {
  getAll: (userId: string): Product[] => {
    return getItems<Product>(STORAGE_KEYS.PRODUCTS).filter(p => p.userId === userId);
  },
  
  getById: (id: string): Product | undefined => {
    return getItems<Product>(STORAGE_KEYS.PRODUCTS).find(p => p.id === id);
  },
  
  create: (product: Omit<Product, 'id' | 'createdAt'>): Product => {
    const products = getItems<Product>(STORAGE_KEYS.PRODUCTS);
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    setItems(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },
  
  update: (id: string, data: Partial<Product>): Product | undefined => {
    const products = getItems<Product>(STORAGE_KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    products[index] = { ...products[index], ...data };
    setItems(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },
  
  delete: (id: string): boolean => {
    const products = getItems<Product>(STORAGE_KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    setItems(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },
};

// Invoice service
export const invoiceService = {
  getAll: (userId: string): Invoice[] => {
    return getItems<Invoice>(STORAGE_KEYS.INVOICES).filter(i => i.userId === userId);
  },
  
  getById: (id: string): Invoice | undefined => {
    return getItems<Invoice>(STORAGE_KEYS.INVOICES).find(i => i.id === id);
  },
  
  getNextNumber: (userId: string): string => {
    const invoices = getItems<Invoice>(STORAGE_KEYS.INVOICES).filter(i => i.userId === userId);
    const maxNum = invoices.reduce((max, inv) => {
      const num = parseInt(inv.id.replace('INV-', ''));
      return num > max ? num : max;
    }, 0);
    return `INV-${String(maxNum + 1).padStart(3, '0')}`;
  },
  
  create: (invoice: Omit<Invoice, 'createdAt'>): Invoice => {
    const invoices = getItems<Invoice>(STORAGE_KEYS.INVOICES);
    const newInvoice: Invoice = {
      ...invoice,
      createdAt: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    setItems(STORAGE_KEYS.INVOICES, invoices);
    return newInvoice;
  },
  
  update: (id: string, data: Partial<Invoice>): Invoice | undefined => {
    const invoices = getItems<Invoice>(STORAGE_KEYS.INVOICES);
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    invoices[index] = { ...invoices[index], ...data };
    setItems(STORAGE_KEYS.INVOICES, invoices);
    return invoices[index];
  },
  
  delete: (id: string): boolean => {
    const invoices = getItems<Invoice>(STORAGE_KEYS.INVOICES);
    const filtered = invoices.filter(i => i.id !== id);
    if (filtered.length === invoices.length) return false;
    setItems(STORAGE_KEYS.INVOICES, filtered);
    return true;
  },
};

// Payment service
export const paymentService = {
  getAll: (userId: string): Payment[] => {
    return getItems<Payment>(STORAGE_KEYS.PAYMENTS).filter(p => p.userId === userId);
  },
  
  create: (payment: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    const payments = getItems<Payment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: Payment = {
      ...payment,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    payments.push(newPayment);
    setItems(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },
  
  delete: (id: string): boolean => {
    const payments = getItems<Payment>(STORAGE_KEYS.PAYMENTS);
    const filtered = payments.filter(p => p.id !== id);
    if (filtered.length === payments.length) return false;
    setItems(STORAGE_KEYS.PAYMENTS, filtered);
    return true;
  },
};

// Template service
export const templateService = {
  getAll: (userId: string): Template[] => {
    return getItems<Template>(STORAGE_KEYS.TEMPLATES).filter(t => t.userId === userId);
  },
  
  create: (template: Omit<Template, 'id' | 'createdAt'>): Template => {
    const templates = getItems<Template>(STORAGE_KEYS.TEMPLATES);
    const newTemplate: Template = {
      ...template,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    setItems(STORAGE_KEYS.TEMPLATES, templates);
    return newTemplate;
  },
  
  update: (id: string, data: Partial<Template>): Template | undefined => {
    const templates = getItems<Template>(STORAGE_KEYS.TEMPLATES);
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    templates[index] = { ...templates[index], ...data };
    setItems(STORAGE_KEYS.TEMPLATES, templates);
    return templates[index];
  },
  
  delete: (id: string): boolean => {
    const templates = getItems<Template>(STORAGE_KEYS.TEMPLATES);
    const filtered = templates.filter(t => t.id !== id);
    if (filtered.length === templates.length) return false;
    setItems(STORAGE_KEYS.TEMPLATES, filtered);
    return true;
  },
};

// Stats helpers
export const statsService = {
  getDashboardStats: (userId: string) => {
    const invoices = invoiceService.getAll(userId);
    const clients = clientService.getAll(userId);
    
    const totalRevenue = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, i) => sum + i.total, 0);
    
    const outstanding = invoices
      .filter(i => i.status === 'Pending' || i.status === 'Overdue')
      .reduce((sum, i) => sum + i.total, 0);
    
    const overdue = invoices.filter(i => i.status === 'Overdue').length;
    
    return {
      totalRevenue,
      totalInvoices: invoices.length,
      outstanding,
      overdueCount: overdue,
      activeClients: clients.filter(c => c.status === 'Active').length,
    };
  },
  
  getClientStats: (userId: string, clientId: string) => {
    const invoices = invoiceService.getAll(userId).filter(i => i.clientId === clientId);
    const totalRevenue = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, i) => sum + i.total, 0);
    return {
      totalRevenue,
      invoiceCount: invoices.length,
    };
  },
};
