// Automated Test Runner Engine
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://invoices.ieosuia.com/api';

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'warning';
export type TestPriority = 'P0' | 'P1' | 'P2';
export type TestCategory = 'api' | 'auth' | 'frontend' | 'database' | 'security' | 'integration' | 'crud';

export interface TestResult {
  id: string;
  name: string;
  category: TestCategory;
  priority: TestPriority;
  status: TestStatus;
  duration: number;
  message?: string;
  error?: string;
  stack?: string;
  expected?: string;
  actual?: string;
  rootCause?: string;
  fix?: string;
  timestamp: Date;
  dataCreated?: unknown;
  dataDeleted?: boolean;
}

export interface TestSuite {
  name: string;
  category: TestCategory;
  tests: TestResult[];
  startTime?: Date;
  endTime?: Date;
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
}

export interface SystemHealth {
  api: boolean;
  database: boolean;
  auth: boolean;
  storage: boolean;
  email: boolean;
}

export interface TestReport {
  id: string;
  startTime: Date;
  endTime?: Date;
  suites: TestSuite[];
  systemHealth: SystemHealth;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
  coverage: number;
  verdict: 'PASS' | 'FAIL' | 'PARTIAL' | 'UNKNOWN';
  confidence: number;
  cleanupStatus?: {
    clientsDeleted: number;
    productsDeleted: number;
    invoicesDeleted: number;
    paymentsDeleted: number;
  };
}

// Test data tracker for cleanup
interface TestDataTracker {
  clients: string[];
  products: string[];
  invoices: string[];
  payments: string[];
  templates: string[];
}

const testDataTracker: TestDataTracker = {
  clients: [],
  products: [],
  invoices: [],
  payments: [],
  templates: [],
};

// Test utilities
export const testUtils = {
  generateId: () => Math.random().toString(36).substring(2, 15),
  
  generateTestEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@testautomation.local`,
  
  generateTestName: (prefix: string) => `[TEST] ${prefix}_${Date.now()}`,
  
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  formatDuration: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  },

  getAuthToken: (): string | null => localStorage.getItem('ieosuia_auth_token'),
  
  isAuthenticated: (): boolean => !!localStorage.getItem('ieosuia_auth_token'),

  trackCreatedData: (type: keyof TestDataTracker, id: string) => {
    testDataTracker[type].push(id);
  },

  getTrackedData: () => ({ ...testDataTracker }),

  clearTrackedData: () => {
    testDataTracker.clients = [];
    testDataTracker.products = [];
    testDataTracker.invoices = [];
    testDataTracker.payments = [];
    testDataTracker.templates = [];
  },
};

// Enhanced API test helper with better response handling
async function testApiEndpoint<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  options: {
    requiresAuth?: boolean;
    body?: unknown;
    expectedStatus?: number;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; status: number; data?: T; error?: string; duration: number; rawResponse?: unknown }> {
  const startTime = Date.now();
  const { requiresAuth = true, body, expectedStatus = 200, timeout = 15000 } = options;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = testUtils.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data: body,
      headers,
      timeout,
      validateStatus: () => true,
    });

    const duration = Date.now() - startTime;
    const success = response.status === expectedStatus || 
                   (expectedStatus === 200 && response.status >= 200 && response.status < 300);

    return {
      success,
      status: response.status,
      data: response.data as T,
      duration,
      error: success ? undefined : `Expected ${expectedStatus}, got ${response.status}`,
      rawResponse: response.data,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

// ==================== API TESTS ====================

export const apiTests = {
  // Health Check
  async healthCheck(): Promise<TestResult> {
    const start = Date.now();
    const result = await testApiEndpoint('GET', '/health', { requiresAuth: false });
    
    return {
      id: testUtils.generateId(),
      name: 'API Health Check',
      category: 'api',
      priority: 'P0',
      status: result.success ? 'passed' : 'failed',
      duration: result.duration,
      message: result.success ? 'API is healthy and responding' : 'API health check failed',
      error: result.error,
      expected: 'Status 200',
      actual: `Status ${result.status}`,
      rootCause: result.error ? 'API server may be down or unreachable' : undefined,
      fix: result.error ? 'Check server status, verify API URL, check network connectivity' : undefined,
      timestamp: new Date(),
    };
  },

  // Auth Endpoints
  async testAuthEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test login endpoint structure (without actual login)
    const loginTest = await testApiEndpoint('POST', '/login', {
      requiresAuth: false,
      body: { email: 'test@invalid.com', password: 'wrongpassword' },
      expectedStatus: 401,
    });

    results.push({
      id: testUtils.generateId(),
      name: 'Login Endpoint Accessibility',
      category: 'auth',
      priority: 'P0',
      status: loginTest.status === 401 || loginTest.status === 422 ? 'passed' : 'failed',
      duration: loginTest.duration,
      message: loginTest.status === 401 ? 'Login endpoint properly rejects invalid credentials' : 
               loginTest.status === 422 ? 'Login endpoint validates input' : 'Unexpected response',
      expected: 'Status 401 or 422',
      actual: `Status ${loginTest.status}`,
      timestamp: new Date(),
    });

    // Test register endpoint structure
    const registerTest = await testApiEndpoint('POST', '/register', {
      requiresAuth: false,
      body: { 
        name: 'Test',
        email: `test_${Date.now()}@invalid.com`, 
        password: 'testpassword123',
        password_confirmation: 'testpassword123',
      },
      expectedStatus: 422, // Should fail validation or already exists
    });

    results.push({
      id: testUtils.generateId(),
      name: 'Register Endpoint Accessibility',
      category: 'auth',
      priority: 'P0',
      status: registerTest.status >= 200 && registerTest.status < 500 ? 'passed' : 'failed',
      duration: registerTest.duration,
      message: `Register endpoint responding with status ${registerTest.status}`,
      expected: 'Status 200-499',
      actual: `Status ${registerTest.status}`,
      timestamp: new Date(),
    });

    // Test authenticated user endpoint
    const userTest = await testApiEndpoint('GET', '/user', { requiresAuth: true });

    results.push({
      id: testUtils.generateId(),
      name: 'Get Current User Endpoint',
      category: 'auth',
      priority: 'P0',
      status: userTest.status === 200 || userTest.status === 401 ? 'passed' : 'failed',
      duration: userTest.duration,
      message: userTest.status === 200 ? 'User endpoint returns authenticated user' :
               userTest.status === 401 ? 'User endpoint properly requires authentication' :
               'Unexpected response',
      expected: 'Status 200 (authenticated) or 401 (not authenticated)',
      actual: `Status ${userTest.status}`,
      timestamp: new Date(),
    });

    return results;
  },

  // Client CRUD Tests
  async testClientEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Clients
    const getClients = await testApiEndpoint('GET', '/clients');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /clients',
      category: 'api',
      priority: 'P0',
      status: getClients.success ? 'passed' : getClients.status === 401 ? 'warning' : 'failed',
      duration: getClients.duration,
      message: getClients.success ? 'Clients list retrieved successfully' : 
               getClients.status === 401 ? 'Requires authentication (expected)' : 'Failed to get clients',
      error: getClients.error,
      expected: 'Status 200 or 401',
      actual: `Status ${getClients.status}`,
      timestamp: new Date(),
    });

    return results;
  },

  // Invoice CRUD Tests
  async testInvoiceEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Invoices
    const getInvoices = await testApiEndpoint('GET', '/invoices');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /invoices',
      category: 'api',
      priority: 'P0',
      status: getInvoices.success ? 'passed' : getInvoices.status === 401 ? 'warning' : 'failed',
      duration: getInvoices.duration,
      message: getInvoices.success ? 'Invoices list retrieved successfully' :
               getInvoices.status === 401 ? 'Requires authentication (expected)' : 'Failed to get invoices',
      error: getInvoices.error,
      expected: 'Status 200 or 401',
      actual: `Status ${getInvoices.status}`,
      timestamp: new Date(),
    });

    return results;
  },

  // Product CRUD Tests
  async testProductEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Products
    const getProducts = await testApiEndpoint('GET', '/products');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /products',
      category: 'api',
      priority: 'P0',
      status: getProducts.success ? 'passed' : getProducts.status === 401 ? 'warning' : 'failed',
      duration: getProducts.duration,
      message: getProducts.success ? 'Products list retrieved successfully' :
               getProducts.status === 401 ? 'Requires authentication (expected)' : 'Failed to get products',
      error: getProducts.error,
      expected: 'Status 200 or 401',
      actual: `Status ${getProducts.status}`,
      timestamp: new Date(),
    });

    return results;
  },

  // Payment CRUD Tests
  async testPaymentEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Payments
    const getPayments = await testApiEndpoint('GET', '/payments');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /payments',
      category: 'api',
      priority: 'P0',
      status: getPayments.success ? 'passed' : getPayments.status === 401 ? 'warning' : 'failed',
      duration: getPayments.duration,
      message: getPayments.success ? 'Payments list retrieved successfully' :
               getPayments.status === 401 ? 'Requires authentication (expected)' : 'Failed to get payments',
      error: getPayments.error,
      expected: 'Status 200 or 401',
      actual: `Status ${getPayments.status}`,
      timestamp: new Date(),
    });

    // GET Payment Summary
    const getSummary = await testApiEndpoint('GET', '/payments/summary');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /payments/summary',
      category: 'api',
      priority: 'P1',
      status: getSummary.success ? 'passed' : getSummary.status === 401 ? 'warning' : 'failed',
      duration: getSummary.duration,
      message: getSummary.success ? 'Payment summary retrieved successfully' :
               getSummary.status === 401 ? 'Requires authentication (expected)' : 'Failed to get summary',
      error: getSummary.error,
      timestamp: new Date(),
    });

    return results;
  },

  // Template CRUD Tests
  async testTemplateEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Templates
    const getTemplates = await testApiEndpoint('GET', '/templates');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /templates',
      category: 'api',
      priority: 'P1',
      status: getTemplates.success ? 'passed' : getTemplates.status === 401 ? 'warning' : 'failed',
      duration: getTemplates.duration,
      message: getTemplates.success ? 'Templates list retrieved successfully' :
               getTemplates.status === 401 ? 'Requires authentication (expected)' : 'Failed to get templates',
      error: getTemplates.error,
      timestamp: new Date(),
    });

    return results;
  },

  // Reports Tests
  async testReportEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Reports Summary
    const getSummary = await testApiEndpoint('GET', '/reports/summary');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /reports/summary',
      category: 'api',
      priority: 'P1',
      status: getSummary.success ? 'passed' : getSummary.status === 401 ? 'warning' : 'failed',
      duration: getSummary.duration,
      message: getSummary.success ? 'Reports summary retrieved successfully' :
               getSummary.status === 401 ? 'Requires authentication (expected)' : 'Failed to get reports',
      error: getSummary.error,
      timestamp: new Date(),
    });

    return results;
  },

  // Notifications Tests
  async testNotificationEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Notifications
    const getNotifications = await testApiEndpoint('GET', '/notifications');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /notifications',
      category: 'api',
      priority: 'P2',
      status: getNotifications.success ? 'passed' : getNotifications.status === 401 ? 'warning' : 'failed',
      duration: getNotifications.duration,
      message: getNotifications.success ? 'Notifications retrieved successfully' :
               getNotifications.status === 401 ? 'Requires authentication (expected)' : 'Failed to get notifications',
      error: getNotifications.error,
      timestamp: new Date(),
    });

    return results;
  },

  // Credits Tests
  async testCreditsEndpoints(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // GET Credits Balance
    const getCredits = await testApiEndpoint('GET', '/credits/balance');
    results.push({
      id: testUtils.generateId(),
      name: 'GET /credits/balance',
      category: 'api',
      priority: 'P1',
      status: getCredits.success ? 'passed' : getCredits.status === 401 ? 'warning' : 'failed',
      duration: getCredits.duration,
      message: getCredits.success ? 'Credits balance retrieved successfully' :
               getCredits.status === 401 ? 'Requires authentication (expected)' : 'Failed to get credits',
      error: getCredits.error,
      timestamp: new Date(),
    });

    return results;
  },
};

// ==================== CRUD TESTS WITH ACTUAL DATA ====================

export const crudTests = {
  // Check if user is authenticated before running CRUD tests
  checkAuth(): TestResult {
    const start = Date.now();
    const isAuth = testUtils.isAuthenticated();
    
    return {
      id: testUtils.generateId(),
      name: 'Authentication Check for CRUD',
      category: 'crud',
      priority: 'P0',
      status: isAuth ? 'passed' : 'skipped',
      duration: Date.now() - start,
      message: isAuth ? 'User is authenticated, CRUD tests can proceed' : 
               'User not authenticated - CRUD tests will be skipped. Please login first.',
      timestamp: new Date(),
    };
  },

  // ========== CLIENT CRUD ==========
  async testClientCRUD(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    if (!testUtils.isAuthenticated()) {
      results.push({
        id: testUtils.generateId(),
        name: 'Client CRUD Suite',
        category: 'crud',
        priority: 'P0',
        status: 'skipped',
        duration: 0,
        message: 'Skipped - User not authenticated',
        timestamp: new Date(),
      });
      return results;
    }

    let createdClientId: string | null = null;
    const testClientData = {
      name: testUtils.generateTestName('Client'),
      email: testUtils.generateTestEmail(),
      phone: '+27123456789',
      company: 'Test Automation Company',
      address: '123 Test Street, Test City',
      status: 'Active',
    };

    // CREATE Client
    const createStart = Date.now();
    const createResult = await testApiEndpoint<{ success: boolean; client: { id: string } }>('POST', '/clients', {
      body: testClientData,
    });

    if (createResult.success && createResult.data?.client?.id) {
      createdClientId = String(createResult.data.client.id);
      testUtils.trackCreatedData('clients', createdClientId);
    }

    results.push({
      id: testUtils.generateId(),
      name: 'CREATE Client',
      category: 'crud',
      priority: 'P0',
      status: createResult.success ? 'passed' : 'failed',
      duration: Date.now() - createStart,
      message: createResult.success ? `Created client with ID: ${createdClientId}` : 'Failed to create client',
      error: createResult.error,
      expected: 'Status 200/201 with client object',
      actual: `Status ${createResult.status}`,
      dataCreated: createResult.data,
      rootCause: createResult.error ? 'API validation failed or server error' : undefined,
      fix: createResult.error ? 'Check request payload, verify all required fields are provided' : undefined,
      timestamp: new Date(),
    });

    // READ Client (if created)
    if (createdClientId) {
      const readStart = Date.now();
      const readResult = await testApiEndpoint('GET', `/clients/${createdClientId}`);
      
      results.push({
        id: testUtils.generateId(),
        name: 'READ Client',
        category: 'crud',
        priority: 'P0',
        status: readResult.success ? 'passed' : 'failed',
        duration: Date.now() - readStart,
        message: readResult.success ? 'Client retrieved successfully' : 'Failed to read client',
        error: readResult.error,
        expected: 'Status 200 with client data',
        actual: `Status ${readResult.status}`,
        timestamp: new Date(),
      });

      // UPDATE Client
      const updateStart = Date.now();
      const updateData = {
        name: testUtils.generateTestName('UpdatedClient'),
        company: 'Updated Test Company',
      };
      const updateResult = await testApiEndpoint('PUT', `/clients/${createdClientId}`, {
        body: updateData,
      });
      
      results.push({
        id: testUtils.generateId(),
        name: 'UPDATE Client',
        category: 'crud',
        priority: 'P0',
        status: updateResult.success ? 'passed' : 'failed',
        duration: Date.now() - updateStart,
        message: updateResult.success ? 'Client updated successfully' : 'Failed to update client',
        error: updateResult.error,
        expected: 'Status 200 with updated client',
        actual: `Status ${updateResult.status}`,
        timestamp: new Date(),
      });

      // DELETE Client (cleanup)
      const deleteStart = Date.now();
      const deleteResult = await testApiEndpoint('DELETE', `/clients/${createdClientId}`);
      
      results.push({
        id: testUtils.generateId(),
        name: 'DELETE Client',
        category: 'crud',
        priority: 'P0',
        status: deleteResult.success ? 'passed' : 'failed',
        duration: Date.now() - deleteStart,
        message: deleteResult.success ? 'Client deleted successfully (cleanup complete)' : 'Failed to delete client',
        error: deleteResult.error,
        expected: 'Status 200',
        actual: `Status ${deleteResult.status}`,
        dataDeleted: deleteResult.success,
        timestamp: new Date(),
      });

      // Remove from tracker if deleted successfully
      if (deleteResult.success) {
        const idx = testDataTracker.clients.indexOf(createdClientId);
        if (idx > -1) testDataTracker.clients.splice(idx, 1);
      }
    }

    return results;
  },

  // ========== PRODUCT CRUD ==========
  async testProductCRUD(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    if (!testUtils.isAuthenticated()) {
      results.push({
        id: testUtils.generateId(),
        name: 'Product CRUD Suite',
        category: 'crud',
        priority: 'P0',
        status: 'skipped',
        duration: 0,
        message: 'Skipped - User not authenticated',
        timestamp: new Date(),
      });
      return results;
    }

    let createdProductId: string | null = null;
    const testProductData = {
      name: testUtils.generateTestName('Product'),
      description: 'Test product created by automated testing',
      price: 99.99,
      tax_rate: 15,
      category: 'Test Category',
    };

    // CREATE Product
    const createStart = Date.now();
    const createResult = await testApiEndpoint<{ success: boolean; product: { id: string } }>('POST', '/products', {
      body: testProductData,
    });

    if (createResult.success && createResult.data?.product?.id) {
      createdProductId = String(createResult.data.product.id);
      testUtils.trackCreatedData('products', createdProductId);
    }

    results.push({
      id: testUtils.generateId(),
      name: 'CREATE Product',
      category: 'crud',
      priority: 'P0',
      status: createResult.success ? 'passed' : 'failed',
      duration: Date.now() - createStart,
      message: createResult.success ? `Created product with ID: ${createdProductId}` : 'Failed to create product',
      error: createResult.error,
      expected: 'Status 200/201 with product object',
      actual: `Status ${createResult.status}`,
      dataCreated: createResult.data,
      timestamp: new Date(),
    });

    // READ Product (if created)
    if (createdProductId) {
      const readStart = Date.now();
      const readResult = await testApiEndpoint('GET', `/products/${createdProductId}`);
      
      results.push({
        id: testUtils.generateId(),
        name: 'READ Product',
        category: 'crud',
        priority: 'P0',
        status: readResult.success ? 'passed' : 'failed',
        duration: Date.now() - readStart,
        message: readResult.success ? 'Product retrieved successfully' : 'Failed to read product',
        error: readResult.error,
        timestamp: new Date(),
      });

      // UPDATE Product
      const updateStart = Date.now();
      const updateData = {
        name: testUtils.generateTestName('UpdatedProduct'),
        price: 149.99,
      };
      const updateResult = await testApiEndpoint('PUT', `/products/${createdProductId}`, {
        body: updateData,
      });
      
      results.push({
        id: testUtils.generateId(),
        name: 'UPDATE Product',
        category: 'crud',
        priority: 'P0',
        status: updateResult.success ? 'passed' : 'failed',
        duration: Date.now() - updateStart,
        message: updateResult.success ? 'Product updated successfully' : 'Failed to update product',
        error: updateResult.error,
        timestamp: new Date(),
      });

      // DELETE Product (cleanup)
      const deleteStart = Date.now();
      const deleteResult = await testApiEndpoint('DELETE', `/products/${createdProductId}`);
      
      results.push({
        id: testUtils.generateId(),
        name: 'DELETE Product',
        category: 'crud',
        priority: 'P0',
        status: deleteResult.success ? 'passed' : 'failed',
        duration: Date.now() - deleteStart,
        message: deleteResult.success ? 'Product deleted successfully (cleanup complete)' : 'Failed to delete product',
        error: deleteResult.error,
        dataDeleted: deleteResult.success,
        timestamp: new Date(),
      });

      if (deleteResult.success) {
        const idx = testDataTracker.products.indexOf(createdProductId);
        if (idx > -1) testDataTracker.products.splice(idx, 1);
      }
    }

    return results;
  },

  // ========== TEMPLATE CRUD ==========
  async testTemplateCRUD(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    if (!testUtils.isAuthenticated()) {
      results.push({
        id: testUtils.generateId(),
        name: 'Template CRUD Suite',
        category: 'crud',
        priority: 'P1',
        status: 'skipped',
        duration: 0,
        message: 'Skipped - User not authenticated',
        timestamp: new Date(),
      });
      return results;
    }

    let createdTemplateId: string | null = null;
    const testTemplateData = {
      name: testUtils.generateTestName('Template'),
      description: 'Test template created by automated testing',
      styles: {
        primaryColor: '#2563eb',
        accentColor: '#10b981',
        fontFamily: 'inter',
        headerStyle: 'left',
        showLogo: true,
        showBorder: true,
        showWatermark: false,
        tableStyle: 'striped',
      },
    };

    // CREATE Template
    const createStart = Date.now();
    const createResult = await testApiEndpoint<{ success: boolean; template: { id: string } }>('POST', '/templates', {
      body: testTemplateData,
    });

    if (createResult.success && createResult.data?.template?.id) {
      createdTemplateId = String(createResult.data.template.id);
      testUtils.trackCreatedData('templates', createdTemplateId);
    }

    results.push({
      id: testUtils.generateId(),
      name: 'CREATE Template',
      category: 'crud',
      priority: 'P1',
      status: createResult.success ? 'passed' : 'failed',
      duration: Date.now() - createStart,
      message: createResult.success ? `Created template with ID: ${createdTemplateId}` : 'Failed to create template',
      error: createResult.error,
      dataCreated: createResult.data,
      timestamp: new Date(),
    });

    if (createdTemplateId) {
      // READ Template
      const readStart = Date.now();
      const readResult = await testApiEndpoint('GET', `/templates/${createdTemplateId}`);
      
      results.push({
        id: testUtils.generateId(),
        name: 'READ Template',
        category: 'crud',
        priority: 'P1',
        status: readResult.success ? 'passed' : 'failed',
        duration: Date.now() - readStart,
        message: readResult.success ? 'Template retrieved successfully' : 'Failed to read template',
        error: readResult.error,
        timestamp: new Date(),
      });

      // UPDATE Template
      const updateStart = Date.now();
      const updateResult = await testApiEndpoint('PUT', `/templates/${createdTemplateId}`, {
        body: { name: testUtils.generateTestName('UpdatedTemplate') },
      });
      
      results.push({
        id: testUtils.generateId(),
        name: 'UPDATE Template',
        category: 'crud',
        priority: 'P1',
        status: updateResult.success ? 'passed' : 'failed',
        duration: Date.now() - updateStart,
        message: updateResult.success ? 'Template updated successfully' : 'Failed to update template',
        error: updateResult.error,
        timestamp: new Date(),
      });

      // DELETE Template (cleanup)
      const deleteStart = Date.now();
      const deleteResult = await testApiEndpoint('DELETE', `/templates/${createdTemplateId}`);
      
      results.push({
        id: testUtils.generateId(),
        name: 'DELETE Template',
        category: 'crud',
        priority: 'P1',
        status: deleteResult.success ? 'passed' : 'failed',
        duration: Date.now() - deleteStart,
        message: deleteResult.success ? 'Template deleted successfully (cleanup complete)' : 'Failed to delete template',
        error: deleteResult.error,
        dataDeleted: deleteResult.success,
        timestamp: new Date(),
      });

      if (deleteResult.success) {
        const idx = testDataTracker.templates.indexOf(createdTemplateId);
        if (idx > -1) testDataTracker.templates.splice(idx, 1);
      }
    }

    return results;
  },

  // ========== INVOICE CRUD (Complex - requires client) ==========
  async testInvoiceCRUD(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    if (!testUtils.isAuthenticated()) {
      results.push({
        id: testUtils.generateId(),
        name: 'Invoice CRUD Suite',
        category: 'crud',
        priority: 'P0',
        status: 'skipped',
        duration: 0,
        message: 'Skipped - User not authenticated',
        timestamp: new Date(),
      });
      return results;
    }

    // First, create a client for the invoice
    let testClientId: string | null = null;
    let createdInvoiceId: string | null = null;

    const clientCreateResult = await testApiEndpoint<{ success: boolean; client: { id: string } }>('POST', '/clients', {
      body: {
        name: testUtils.generateTestName('InvoiceTestClient'),
        email: testUtils.generateTestEmail(),
        phone: '+27111111111',
        company: 'Invoice Test Company',
        status: 'Active',
      },
    });

    if (clientCreateResult.success && clientCreateResult.data?.client?.id) {
      testClientId = String(clientCreateResult.data.client.id);
      testUtils.trackCreatedData('clients', testClientId);
    }

    results.push({
      id: testUtils.generateId(),
      name: 'CREATE Test Client for Invoice',
      category: 'crud',
      priority: 'P0',
      status: clientCreateResult.success ? 'passed' : 'failed',
      duration: clientCreateResult.duration,
      message: clientCreateResult.success ? `Created test client ID: ${testClientId}` : 'Failed to create test client',
      error: clientCreateResult.error,
      timestamp: new Date(),
    });

    if (testClientId) {
      // CREATE Invoice
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const invoiceData = {
        client_id: testClientId,
        status: 'Draft',
        date: today,
        due_date: dueDate,
        notes: 'Test invoice created by automated testing',
        items: [
          {
            name: 'Test Service',
            description: 'Automated test line item',
            quantity: 2,
            price: 100.00,
            tax_rate: 15,
          },
        ],
      };

      const createStart = Date.now();
      const createResult = await testApiEndpoint<{ success: boolean; invoice: { id: string } }>('POST', '/invoices', {
        body: invoiceData,
      });

      if (createResult.success && createResult.data?.invoice?.id) {
        createdInvoiceId = String(createResult.data.invoice.id);
        testUtils.trackCreatedData('invoices', createdInvoiceId);
      }

      results.push({
        id: testUtils.generateId(),
        name: 'CREATE Invoice',
        category: 'crud',
        priority: 'P0',
        status: createResult.success ? 'passed' : 'failed',
        duration: Date.now() - createStart,
        message: createResult.success ? `Created invoice with ID: ${createdInvoiceId}` : 'Failed to create invoice',
        error: createResult.error,
        expected: 'Status 200/201 with invoice object',
        actual: `Status ${createResult.status}`,
        dataCreated: createResult.data,
        timestamp: new Date(),
      });

      if (createdInvoiceId) {
        // READ Invoice
        const readStart = Date.now();
        const readResult = await testApiEndpoint('GET', `/invoices/${createdInvoiceId}`);
        
        results.push({
          id: testUtils.generateId(),
          name: 'READ Invoice',
          category: 'crud',
          priority: 'P0',
          status: readResult.success ? 'passed' : 'failed',
          duration: Date.now() - readStart,
          message: readResult.success ? 'Invoice retrieved successfully' : 'Failed to read invoice',
          error: readResult.error,
          timestamp: new Date(),
        });

        // UPDATE Invoice
        const updateStart = Date.now();
        const updateResult = await testApiEndpoint('PUT', `/invoices/${createdInvoiceId}`, {
          body: { notes: 'Updated by automated test' },
        });
        
        results.push({
          id: testUtils.generateId(),
          name: 'UPDATE Invoice',
          category: 'crud',
          priority: 'P0',
          status: updateResult.success ? 'passed' : 'failed',
          duration: Date.now() - updateStart,
          message: updateResult.success ? 'Invoice updated successfully' : 'Failed to update invoice',
          error: updateResult.error,
          timestamp: new Date(),
        });

        // MARK PAID
        const markPaidStart = Date.now();
        const markPaidResult = await testApiEndpoint('POST', `/invoices/${createdInvoiceId}/mark-paid`);
        
        results.push({
          id: testUtils.generateId(),
          name: 'MARK Invoice as Paid',
          category: 'crud',
          priority: 'P0',
          status: markPaidResult.success ? 'passed' : 'failed',
          duration: Date.now() - markPaidStart,
          message: markPaidResult.success ? 'Invoice marked as paid successfully' : 'Failed to mark invoice as paid',
          error: markPaidResult.error,
          timestamp: new Date(),
        });

        // DELETE Invoice (cleanup)
        const deleteStart = Date.now();
        const deleteResult = await testApiEndpoint('DELETE', `/invoices/${createdInvoiceId}`);
        
        results.push({
          id: testUtils.generateId(),
          name: 'DELETE Invoice',
          category: 'crud',
          priority: 'P0',
          status: deleteResult.success ? 'passed' : 'failed',
          duration: Date.now() - deleteStart,
          message: deleteResult.success ? 'Invoice deleted successfully (cleanup)' : 'Failed to delete invoice',
          error: deleteResult.error,
          dataDeleted: deleteResult.success,
          timestamp: new Date(),
        });

        if (deleteResult.success) {
          const idx = testDataTracker.invoices.indexOf(createdInvoiceId);
          if (idx > -1) testDataTracker.invoices.splice(idx, 1);
        }
      }

      // Cleanup test client
      if (testClientId) {
        const clientDeleteResult = await testApiEndpoint('DELETE', `/clients/${testClientId}`);
        results.push({
          id: testUtils.generateId(),
          name: 'DELETE Test Client (Cleanup)',
          category: 'crud',
          priority: 'P1',
          status: clientDeleteResult.success ? 'passed' : 'warning',
          duration: clientDeleteResult.duration,
          message: clientDeleteResult.success ? 'Test client cleaned up' : 'Failed to cleanup test client',
          error: clientDeleteResult.error,
          dataDeleted: clientDeleteResult.success,
          timestamp: new Date(),
        });

        if (clientDeleteResult.success) {
          const idx = testDataTracker.clients.indexOf(testClientId);
          if (idx > -1) testDataTracker.clients.splice(idx, 1);
        }
      }
    }

    return results;
  },

  // ========== BULK CLEANUP ==========
  async runCleanup(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const tracker = testUtils.getTrackedData();

    // Cleanup any remaining test data
    for (const invoiceId of tracker.invoices) {
      const result = await testApiEndpoint('DELETE', `/invoices/${invoiceId}`);
      results.push({
        id: testUtils.generateId(),
        name: `Cleanup Invoice ${invoiceId}`,
        category: 'crud',
        priority: 'P2',
        status: result.success ? 'passed' : 'warning',
        duration: result.duration,
        message: result.success ? 'Cleaned up' : 'Cleanup failed (may already be deleted)',
        timestamp: new Date(),
      });
    }

    for (const clientId of tracker.clients) {
      const result = await testApiEndpoint('DELETE', `/clients/${clientId}`);
      results.push({
        id: testUtils.generateId(),
        name: `Cleanup Client ${clientId}`,
        category: 'crud',
        priority: 'P2',
        status: result.success ? 'passed' : 'warning',
        duration: result.duration,
        message: result.success ? 'Cleaned up' : 'Cleanup failed (may already be deleted)',
        timestamp: new Date(),
      });
    }

    for (const productId of tracker.products) {
      const result = await testApiEndpoint('DELETE', `/products/${productId}`);
      results.push({
        id: testUtils.generateId(),
        name: `Cleanup Product ${productId}`,
        category: 'crud',
        priority: 'P2',
        status: result.success ? 'passed' : 'warning',
        duration: result.duration,
        message: result.success ? 'Cleaned up' : 'Cleanup failed (may already be deleted)',
        timestamp: new Date(),
      });
    }

    for (const templateId of tracker.templates) {
      const result = await testApiEndpoint('DELETE', `/templates/${templateId}`);
      results.push({
        id: testUtils.generateId(),
        name: `Cleanup Template ${templateId}`,
        category: 'crud',
        priority: 'P2',
        status: result.success ? 'passed' : 'warning',
        duration: result.duration,
        message: result.success ? 'Cleaned up' : 'Cleanup failed (may already be deleted)',
        timestamp: new Date(),
      });
    }

    // Clear the tracker
    testUtils.clearTrackedData();

    if (results.length === 0) {
      results.push({
        id: testUtils.generateId(),
        name: 'Cleanup Check',
        category: 'crud',
        priority: 'P2',
        status: 'passed',
        duration: 0,
        message: 'No orphaned test data found',
        timestamp: new Date(),
      });
    }

    return results;
  },
};

// ==================== FRONTEND TESTS ====================

export const frontendTests = {
  // DOM Tests
  async testPageLoad(): Promise<TestResult> {
    const start = Date.now();
    const hasReactRoot = !!document.getElementById('root');
    const duration = Date.now() - start;

    return {
      id: testUtils.generateId(),
      name: 'React App Mount',
      category: 'frontend',
      priority: 'P0',
      status: hasReactRoot ? 'passed' : 'failed',
      duration,
      message: hasReactRoot ? 'React app mounted successfully' : 'React root element not found',
      expected: 'Element with id="root" exists',
      actual: hasReactRoot ? 'Root element found' : 'Root element missing',
      timestamp: new Date(),
    };
  },

  async testLocalStorage(): Promise<TestResult> {
    const start = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      success = value === 'test';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Storage access failed';
    }

    return {
      id: testUtils.generateId(),
      name: 'LocalStorage Accessibility',
      category: 'frontend',
      priority: 'P0',
      status: success ? 'passed' : 'failed',
      duration: Date.now() - start,
      message: success ? 'LocalStorage is accessible' : 'LocalStorage not accessible',
      error,
      timestamp: new Date(),
    };
  },

  async testConsoleErrors(): Promise<TestResult> {
    const start = Date.now();
    // Check for common error indicators in the DOM
    const errorBoundaries = document.querySelectorAll('[class*="error"], [class*="Error"]');
    const hasVisibleErrors = Array.from(errorBoundaries).some(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    return {
      id: testUtils.generateId(),
      name: 'No Visible Errors',
      category: 'frontend',
      priority: 'P0',
      status: hasVisibleErrors ? 'warning' : 'passed',
      duration: Date.now() - start,
      message: hasVisibleErrors ? 'Potential error elements detected in DOM' : 'No visible error elements',
      timestamp: new Date(),
    };
  },

  async testResponsiveDesign(): Promise<TestResult> {
    const start = Date.now();
    const hasViewportMeta = !!document.querySelector('meta[name="viewport"]');
    
    return {
      id: testUtils.generateId(),
      name: 'Responsive Design Meta',
      category: 'frontend',
      priority: 'P1',
      status: hasViewportMeta ? 'passed' : 'warning',
      duration: Date.now() - start,
      message: hasViewportMeta ? 'Viewport meta tag present' : 'Missing viewport meta tag',
      timestamp: new Date(),
    };
  },

  async testAccessibility(): Promise<TestResult> {
    const start = Date.now();
    const issues: string[] = [];

    // Check for alt attributes on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt) {
        issues.push(`Image ${index + 1} missing alt attribute`);
      }
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      if (!hasLabel && !hasAriaLabel) {
        issues.push(`Input ${index + 1} missing label or aria-label`);
      }
    });

    return {
      id: testUtils.generateId(),
      name: 'Basic Accessibility',
      category: 'frontend',
      priority: 'P2',
      status: issues.length === 0 ? 'passed' : issues.length < 5 ? 'warning' : 'failed',
      duration: Date.now() - start,
      message: issues.length === 0 ? 'No accessibility issues found' : `Found ${issues.length} accessibility issues`,
      error: issues.length > 0 ? issues.slice(0, 5).join('; ') : undefined,
      timestamp: new Date(),
    };
  },
};

// ==================== SECURITY TESTS ====================

export const securityTests = {
  async testXSSVulnerability(): Promise<TestResult> {
    const start = Date.now();
    // Check for unsafe innerHTML usage indicators
    const scripts = document.querySelectorAll('script:not([src])');
    const hasInlineScripts = scripts.length > 0;

    return {
      id: testUtils.generateId(),
      name: 'Inline Script Detection',
      category: 'security',
      priority: 'P0',
      status: hasInlineScripts ? 'warning' : 'passed',
      duration: Date.now() - start,
      message: hasInlineScripts ? `Found ${scripts.length} inline scripts` : 'No inline scripts detected',
      timestamp: new Date(),
    };
  },

  async testSecureStorage(): Promise<TestResult> {
    const start = Date.now();
    const token = localStorage.getItem('ieosuia_auth_token');
    const hasToken = !!token;

    return {
      id: testUtils.generateId(),
      name: 'Auth Token Storage',
      category: 'security',
      priority: 'P1',
      status: 'passed', // We're just checking, not failing
      duration: Date.now() - start,
      message: hasToken ? 'Auth token found in localStorage (standard practice)' : 'No auth token stored',
      timestamp: new Date(),
    };
  },

  async testHTTPS(): Promise<TestResult> {
    const start = Date.now();
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    return {
      id: testUtils.generateId(),
      name: 'HTTPS Protocol',
      category: 'security',
      priority: 'P0',
      status: isSecure ? 'passed' : 'warning',
      duration: Date.now() - start,
      message: isSecure ? 'Connection is secure' : 'Not using HTTPS',
      expected: 'HTTPS or localhost',
      actual: window.location.protocol,
      timestamp: new Date(),
    };
  },

  async testCSP(): Promise<TestResult> {
    const start = Date.now();
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    return {
      id: testUtils.generateId(),
      name: 'Content Security Policy',
      category: 'security',
      priority: 'P2',
      status: cspMeta ? 'passed' : 'warning',
      duration: Date.now() - start,
      message: cspMeta ? 'CSP meta tag found' : 'No CSP meta tag (may be set via headers)',
      timestamp: new Date(),
    };
  },
};

// ==================== INTEGRATION TESTS ====================

export const integrationTests = {
  async testAuthFlow(): Promise<TestResult> {
    const start = Date.now();
    const token = testUtils.getAuthToken();
    const cachedUser = localStorage.getItem('auth_user');
    
    let status: TestStatus = 'passed';
    let message = '';

    if (token && cachedUser) {
      status = 'passed';
      message = 'User is authenticated with valid token and cached user data';
    } else if (token && !cachedUser) {
      status = 'warning';
      message = 'Token exists but no cached user data';
    } else {
      status = 'passed';
      message = 'User is not authenticated (expected for guest users)';
    }

    return {
      id: testUtils.generateId(),
      name: 'Authentication State',
      category: 'integration',
      priority: 'P0',
      status,
      duration: Date.now() - start,
      message,
      timestamp: new Date(),
    };
  },

  async testRouting(): Promise<TestResult> {
    const start = Date.now();
    const currentPath = window.location.pathname;
    const validRoutes = ['/', '/login', '/register', '/dashboard', '/admin'];
    const isValidRoute = validRoutes.some(route => currentPath.startsWith(route));

    return {
      id: testUtils.generateId(),
      name: 'Route Validation',
      category: 'integration',
      priority: 'P1',
      status: isValidRoute ? 'passed' : 'warning',
      duration: Date.now() - start,
      message: `Current route: ${currentPath}`,
      timestamp: new Date(),
    };
  },

  async testDataPersistence(): Promise<TestResult> {
    const start = Date.now();
    const checks = {
      authToken: !!localStorage.getItem('ieosuia_auth_token'),
      authUser: !!localStorage.getItem('auth_user'),
      cookieConsent: !!localStorage.getItem('cookie_consent'),
    };

    const storedItems = Object.entries(checks).filter(([, v]) => v).length;

    return {
      id: testUtils.generateId(),
      name: 'Data Persistence Check',
      category: 'integration',
      priority: 'P1',
      status: 'passed',
      duration: Date.now() - start,
      message: `Found ${storedItems} persisted data items`,
      timestamp: new Date(),
    };
  },
};

// Import file verification tests
import { runFileVerificationTests, generateFileDependencyTestResults } from './fileVerificationTests';
import { generateAppStructureDoc } from './fileDependencyMap';

// ==================== MAIN TEST RUNNER ====================

export class TestRunner {
  private report: TestReport;
  private onProgress?: (report: TestReport) => void;

  constructor(onProgress?: (report: TestReport) => void) {
    this.onProgress = onProgress;
    this.report = {
      id: testUtils.generateId(),
      startTime: new Date(),
      suites: [],
      systemHealth: {
        api: false,
        database: false,
        auth: false,
        storage: false,
        email: false,
      },
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      coverage: 0,
      verdict: 'UNKNOWN',
      confidence: 0,
    };
  }

  private updateReport() {
    this.report.totalTests = this.report.suites.reduce((acc, s) => acc + s.tests.length, 0);
    this.report.passed = this.report.suites.reduce((acc, s) => acc + s.passed, 0);
    this.report.failed = this.report.suites.reduce((acc, s) => acc + s.failed, 0);
    this.report.skipped = this.report.suites.reduce((acc, s) => acc + s.skipped, 0);
    this.report.warnings = this.report.suites.reduce((acc, s) => acc + s.warnings, 0);
    
    if (this.report.totalTests > 0) {
      this.report.coverage = Math.round((this.report.passed / this.report.totalTests) * 100);
      this.report.confidence = Math.round(((this.report.passed + this.report.warnings) / this.report.totalTests) * 100);
    }

    if (this.report.failed > 0) {
      this.report.verdict = this.report.failed > this.report.passed ? 'FAIL' : 'PARTIAL';
    } else if (this.report.warnings > 0) {
      this.report.verdict = 'PARTIAL';
    } else if (this.report.passed > 0) {
      this.report.verdict = 'PASS';
    }

    this.onProgress?.(this.report);
  }

  private addSuite(name: string, category: TestCategory, tests: TestResult[]) {
    const suite: TestSuite = {
      name,
      category,
      tests,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      skipped: tests.filter(t => t.status === 'skipped').length,
      warnings: tests.filter(t => t.status === 'warning').length,
    };
    this.report.suites.push(suite);
    this.updateReport();
  }

  async runAll(): Promise<TestReport> {
    this.report.startTime = new Date();

    // Clear any previous test data tracking
    testUtils.clearTrackedData();

    // P0 Critical Tests
    // Health Check
    const healthResult = await apiTests.healthCheck();
    this.addSuite('API Health', 'api', [healthResult]);
    this.report.systemHealth.api = healthResult.status === 'passed';

    // Auth Tests
    const authResults = await apiTests.testAuthEndpoints();
    this.addSuite('Authentication API', 'auth', authResults);
    this.report.systemHealth.auth = authResults.some(r => r.status === 'passed');

    // Frontend Tests
    const frontendResults = await Promise.all([
      frontendTests.testPageLoad(),
      frontendTests.testLocalStorage(),
      frontendTests.testConsoleErrors(),
      frontendTests.testResponsiveDesign(),
      frontendTests.testAccessibility(),
    ]);
    this.addSuite('Frontend', 'frontend', frontendResults);
    this.report.systemHealth.storage = frontendResults[1].status === 'passed';

    // API Endpoint Tests
    const clientResults = await apiTests.testClientEndpoints();
    this.addSuite('Clients API', 'api', clientResults);

    const invoiceResults = await apiTests.testInvoiceEndpoints();
    this.addSuite('Invoices API', 'api', invoiceResults);

    const productResults = await apiTests.testProductEndpoints();
    this.addSuite('Products API', 'api', productResults);

    const paymentResults = await apiTests.testPaymentEndpoints();
    this.addSuite('Payments API', 'api', paymentResults);

    const templateResults = await apiTests.testTemplateEndpoints();
    this.addSuite('Templates API', 'api', templateResults);

    const reportResults = await apiTests.testReportEndpoints();
    this.addSuite('Reports API', 'api', reportResults);

    const notificationResults = await apiTests.testNotificationEndpoints();
    this.addSuite('Notifications API', 'api', notificationResults);

    const creditsResults = await apiTests.testCreditsEndpoints();
    this.addSuite('Credits API', 'api', creditsResults);

    // ========== CRUD TESTS WITH ACTUAL DATA ==========
    // Check authentication status first
    const authCheck = crudTests.checkAuth();
    this.addSuite('CRUD Auth Check', 'crud', [authCheck]);

    if (authCheck.status === 'passed') {
      // Run CRUD tests with actual data creation/deletion
      this.report.systemHealth.database = true;

      // Client CRUD
      const clientCrudResults = await crudTests.testClientCRUD();
      this.addSuite('Client CRUD', 'crud', clientCrudResults);

      // Product CRUD
      const productCrudResults = await crudTests.testProductCRUD();
      this.addSuite('Product CRUD', 'crud', productCrudResults);

      // Template CRUD
      const templateCrudResults = await crudTests.testTemplateCRUD();
      this.addSuite('Template CRUD', 'crud', templateCrudResults);

      // Invoice CRUD (most complex - creates client too)
      const invoiceCrudResults = await crudTests.testInvoiceCRUD();
      this.addSuite('Invoice CRUD', 'crud', invoiceCrudResults);

      // Run cleanup for any orphaned test data
      const cleanupResults = await crudTests.runCleanup();
      this.addSuite('Test Data Cleanup', 'crud', cleanupResults);

      // Track cleanup status
      const tracker = testUtils.getTrackedData();
      this.report.cleanupStatus = {
        clientsDeleted: tracker.clients.length === 0 ? clientCrudResults.filter(r => r.dataDeleted).length : 0,
        productsDeleted: tracker.products.length === 0 ? productCrudResults.filter(r => r.dataDeleted).length : 0,
        invoicesDeleted: tracker.invoices.length === 0 ? invoiceCrudResults.filter(r => r.dataDeleted).length : 0,
        paymentsDeleted: 0,
      };
    }

    // Security Tests
    const securityResults = await Promise.all([
      securityTests.testXSSVulnerability(),
      securityTests.testSecureStorage(),
      securityTests.testHTTPS(),
      securityTests.testCSP(),
    ]);
    this.addSuite('Security', 'security', securityResults);

    // Integration Tests
    const integrationResults = await Promise.all([
      integrationTests.testAuthFlow(),
      integrationTests.testRouting(),
      integrationTests.testDataPersistence(),
    ]);
    this.addSuite('Integration', 'integration', integrationResults);

    // ========== FILE DEPENDENCY VERIFICATION ==========
    try {
      const fileVerificationSuite = await runFileVerificationTests();
      this.report.suites.push(fileVerificationSuite);
      this.updateReport();

      // Generate file dependency test results for each page
      const fileDependencyResults = await generateFileDependencyTestResults();
      this.addSuite('Page File Dependencies', 'frontend', fileDependencyResults);
    } catch (error) {
      console.warn('File verification tests skipped:', error);
    }

    this.report.endTime = new Date();
    this.updateReport();

    return this.report;
  }

  // Generate application structure documentation
  generateDocumentation(): string {
    return generateAppStructureDoc();
  }

  getReport(): TestReport {
    return this.report;
  }
}

// Export for generating reports
export function generateTextReport(report: TestReport): string {
  let text = `
╔══════════════════════════════════════════════════════════════╗
║              AUTOMATED SYSTEM TEST REPORT                     ║
╠══════════════════════════════════════════════════════════════╣
║ Report ID: ${report.id.padEnd(48)}║
║ Started: ${report.startTime.toISOString().padEnd(50)}║
║ Completed: ${(report.endTime?.toISOString() || 'In Progress').padEnd(48)}║
╠══════════════════════════════════════════════════════════════╣
║ VERDICT: ${report.verdict.padEnd(51)}║
║ Confidence: ${(report.confidence + '%').padEnd(48)}║
╠══════════════════════════════════════════════════════════════╣
║ Total Tests: ${String(report.totalTests).padEnd(47)}║
║ ✅ Passed: ${String(report.passed).padEnd(49)}║
║ ❌ Failed: ${String(report.failed).padEnd(49)}║
║ ⚠️  Warnings: ${String(report.warnings).padEnd(47)}║
║ ⏭️  Skipped: ${String(report.skipped).padEnd(48)}║
╠══════════════════════════════════════════════════════════════╣
║ SYSTEM HEALTH                                                ║
║ API: ${(report.systemHealth.api ? '✅' : '❌').padEnd(55)}║
║ Auth: ${(report.systemHealth.auth ? '✅' : '❌').padEnd(54)}║
║ Storage: ${(report.systemHealth.storage ? '✅' : '❌').padEnd(51)}║
╚══════════════════════════════════════════════════════════════╝

`;

  report.suites.forEach(suite => {
    text += `\n━━━ ${suite.name} (${suite.category.toUpperCase()}) ━━━\n`;
    text += `Passed: ${suite.passed} | Failed: ${suite.failed} | Warnings: ${suite.warnings}\n\n`;
    
    suite.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : 
                   test.status === 'failed' ? '❌' : 
                   test.status === 'warning' ? '⚠️' : '⏭️';
      text += `${icon} ${test.name} (${test.duration}ms)\n`;
      if (test.message) text += `   ${test.message}\n`;
      if (test.error) text += `   ERROR: ${test.error}\n`;
      if (test.rootCause) text += `   ROOT CAUSE: ${test.rootCause}\n`;
      if (test.fix) text += `   FIX: ${test.fix}\n`;
    });
  });

  return text;
}

export function generateJSONReport(report: TestReport): string {
  return JSON.stringify(report, null, 2);
}
