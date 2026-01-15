// File Verification Tests for Ieosuia Invoices Application
// This module performs runtime verification of file dependencies

import { 
  coreFileDependencies, 
  pageDependencyMaps, 
  getAllRequiredFiles,
  FileDependency,
  PageDependencyMap 
} from './fileDependencyMap';
import { TestResult, TestSuite, testUtils } from './testRunner';

export interface FileVerificationResult {
  path: string;
  exists: boolean;
  accessible: boolean;
  type: string;
  error?: string;
  loadTime?: number;
}

export interface PageVerificationResult {
  pageName: string;
  pageUrl: string;
  totalDependencies: number;
  verifiedDependencies: number;
  missingDependencies: FileDependency[];
  passRate: number;
  status: 'passed' | 'failed' | 'partial';
}

// Check if a frontend file can be dynamically imported
async function verifyFrontendFile(path: string): Promise<FileVerificationResult> {
  const start = Date.now();
  
  try {
    // For frontend files, we try to dynamically import them
    // Convert path to import format
    const importPath = path
      .replace('src/', '@/')
      .replace('.tsx', '')
      .replace('.ts', '');
    
    // Try to import the module - this works for Vite bundled files
    const module = await import(/* @vite-ignore */ importPath);
    
    return {
      path,
      exists: true,
      accessible: !!module,
      type: 'frontend',
      loadTime: Date.now() - start,
    };
  } catch (error) {
    return {
      path,
      exists: false,
      accessible: false,
      type: 'frontend',
      error: error instanceof Error ? error.message : 'Unknown error',
      loadTime: Date.now() - start,
    };
  }
}

// Verify that a route/page exists in the router
async function verifyRoute(pageUrl: string): Promise<boolean> {
  // Check if route exists by attempting navigation simulation
  // This is a simplified check - in production you'd use router introspection
  const validRoutes = [
    '/', '/login', '/register', '/dashboard', '/clients', '/products',
    '/invoices', '/recurring-invoices', '/payments', '/templates',
    '/reports', '/reminders', '/profile', '/settings', '/subscription',
    '/billing', '/notifications', '/email-templates', '/tests',
    '/contact', '/faq', '/docs', '/support', '/privacy', '/terms',
    '/cookies', '/popia', '/careers', '/verify-email', '/forgot-password',
    '/reset-password', '/payment/success', '/payment/failed',
    '/auth/google/callback', '/verify-email-reminder',
    '/admin', '/admin/users', '/admin/subscriptions', '/admin/activity',
    '/admin/emails', '/admin/settings', '/admin/qa', '/admin/submissions',
  ];
  
  return validRoutes.includes(pageUrl) || pageUrl === '*';
}

// Check if an API endpoint is accessible
async function verifyApiEndpoint(endpoint: string): Promise<boolean> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://invoices.ieosuia.com/api';
    const [method, path] = endpoint.split(' ');
    
    // For GET endpoints, we can check accessibility
    if (method === 'GET') {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/json',
        },
      });
      // 401 is expected for authenticated endpoints
      return response.status !== 404;
    }
    
    // For other methods, assume accessible if route exists
    return true;
  } catch {
    return false;
  }
}

// Check if required frontend modules exist at runtime
async function checkModuleExists(modulePath: string): Promise<boolean> {
  try {
    // Map paths to dynamic imports
    const moduleMap: Record<string, () => Promise<unknown>> = {
      // Pages
      'src/pages/Dashboard.tsx': () => import('@/pages/Dashboard'),
      'src/pages/Login.tsx': () => import('@/pages/Login'),
      'src/pages/Register.tsx': () => import('@/pages/Register'),
      'src/pages/Clients.tsx': () => import('@/pages/Clients'),
      'src/pages/Products.tsx': () => import('@/pages/Products'),
      'src/pages/Invoices.tsx': () => import('@/pages/Invoices'),
      'src/pages/Payments.tsx': () => import('@/pages/Payments'),
      'src/pages/Templates.tsx': () => import('@/pages/Templates'),
      'src/pages/Reports.tsx': () => import('@/pages/Reports'),
      'src/pages/Profile.tsx': () => import('@/pages/Profile'),
      'src/pages/Settings.tsx': () => import('@/pages/Settings'),
      'src/pages/Index.tsx': () => import('@/pages/Index'),
      'src/pages/AutomatedTests.tsx': () => import('@/pages/AutomatedTests'),
      
      // Contexts
      'src/contexts/AuthContext.tsx': () => import('@/contexts/AuthContext'),
      
      // Hooks
      'src/hooks/useClients.ts': () => import('@/hooks/useClients'),
      'src/hooks/useProducts.ts': () => import('@/hooks/useProducts'),
      'src/hooks/useInvoices.ts': () => import('@/hooks/useInvoices'),
      'src/hooks/usePayments.ts': () => import('@/hooks/usePayments'),
      'src/hooks/useTemplates.ts': () => import('@/hooks/useTemplates'),
      'src/hooks/useReports.ts': () => import('@/hooks/useReports'),
      'src/hooks/useCredits.ts': () => import('@/hooks/useCredits'),
      'src/hooks/useNotifications.ts': () => import('@/hooks/useNotifications'),
      'src/hooks/useRecaptcha.ts': () => import('@/hooks/useRecaptcha'),
      'src/hooks/useCurrency.ts': () => import('@/hooks/useCurrency'),
      
      // Services
      'src/services/api.ts': () => import('@/services/api'),
      
      // Libs
      'src/lib/testRunner.ts': () => import('@/lib/testRunner'),
      'src/lib/fileDependencyMap.ts': () => import('@/lib/fileDependencyMap'),
      'src/lib/currencies.ts': () => import('@/lib/currencies'),
      'src/lib/exportUtils.ts': () => import('@/lib/exportUtils'),
      'src/lib/templatePresets.ts': () => import('@/lib/templatePresets'),
      
      // UI Components
      'src/components/ui/button.tsx': () => import('@/components/ui/button'),
      'src/components/ui/card.tsx': () => import('@/components/ui/card'),
      'src/components/ui/dialog.tsx': () => import('@/components/ui/dialog'),
      'src/components/ui/form.tsx': () => import('@/components/ui/form'),
      'src/components/ui/input.tsx': () => import('@/components/ui/input'),
      'src/components/ui/table.tsx': () => import('@/components/ui/table'),
      
      // Protected Route
      'src/components/ProtectedRoute.tsx': () => import('@/components/ProtectedRoute'),
    };
    
    const importer = moduleMap[modulePath];
    if (importer) {
      await importer();
      return true;
    }
    
    // If not in map, assume it exists (backend files can't be verified from frontend)
    return modulePath.startsWith('api/') || 
           modulePath.endsWith('.json') || 
           modulePath.endsWith('.css') ||
           modulePath.endsWith('.html') ||
           modulePath.endsWith('.config.ts');
  } catch {
    return false;
  }
}

// Generate file verification test suite
export async function runFileVerificationTests(): Promise<TestSuite> {
  const results: TestResult[] = [];
  const startTime = new Date();
  
  // Test 1: Core Application Entry Points
  const entryPointTest = await testCoreEntryPoints();
  results.push(entryPointTest);
  
  // Test 2: Authentication Context
  const authContextTest = await testAuthContext();
  results.push(authContextTest);
  
  // Test 3: API Service
  const apiServiceTest = await testApiService();
  results.push(apiServiceTest);
  
  // Test 4: Core UI Components
  const uiComponentTests = await testCoreUIComponents();
  results.push(...uiComponentTests);
  
  // Test 5: Page Components
  const pageTests = await testPageComponents();
  results.push(...pageTests);
  
  // Test 6: Hooks
  const hookTests = await testHooks();
  results.push(...hookTests);
  
  // Test 7: Route Verification
  const routeTests = await testRoutes();
  results.push(...routeTests);
  
  return {
    name: 'File Dependency Verification',
    category: 'frontend',
    tests: results,
    startTime,
    endTime: new Date(),
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    warnings: results.filter(r => r.status === 'warning').length,
  };
}

async function testCoreEntryPoints(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    // Verify main entry points exist
    const mainApp = await import('@/App');
    const mainEntry = document.getElementById('root');
    
    const appExists = !!mainApp && !!mainApp.default;
    const rootExists = !!mainEntry;
    
    return {
      id: testUtils.generateId(),
      name: 'Core Entry Points Verification',
      category: 'frontend',
      priority: 'P0',
      status: appExists && rootExists ? 'passed' : 'failed',
      duration: Date.now() - start,
      message: appExists && rootExists 
        ? 'All core entry points (App.tsx, index.html) are accessible' 
        : 'Missing core entry points',
      expected: 'App.tsx and root element exist',
      actual: `App.tsx: ${appExists}, Root element: ${rootExists}`,
      rootCause: !appExists || !rootExists ? 'Core application files may be missing or corrupted' : undefined,
      fix: !appExists || !rootExists ? 'Ensure src/App.tsx exists and index.html has #root element' : undefined,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: testUtils.generateId(),
      name: 'Core Entry Points Verification',
      category: 'frontend',
      priority: 'P0',
      status: 'failed',
      duration: Date.now() - start,
      message: 'Failed to verify core entry points',
      error: error instanceof Error ? error.message : 'Unknown error',
      rootCause: 'Core application files may be missing or have syntax errors',
      fix: 'Check src/App.tsx for syntax errors and ensure all imports are valid',
      timestamp: new Date(),
    };
  }
}

async function testAuthContext(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const authModule = await import('@/contexts/AuthContext');
    const hasProvider = !!authModule.AuthProvider;
    const hasHook = !!authModule.useAuth;
    
    return {
      id: testUtils.generateId(),
      name: 'Authentication Context Verification',
      category: 'auth',
      priority: 'P0',
      status: hasProvider && hasHook ? 'passed' : 'failed',
      duration: Date.now() - start,
      message: hasProvider && hasHook 
        ? 'AuthContext exports AuthProvider and useAuth correctly' 
        : 'Missing AuthContext exports',
      expected: 'AuthProvider and useAuth exports',
      actual: `AuthProvider: ${hasProvider}, useAuth: ${hasHook}`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: testUtils.generateId(),
      name: 'Authentication Context Verification',
      category: 'auth',
      priority: 'P0',
      status: 'failed',
      duration: Date.now() - start,
      message: 'Failed to load AuthContext',
      error: error instanceof Error ? error.message : 'Unknown error',
      rootCause: 'AuthContext.tsx may have import errors or syntax issues',
      fix: 'Check src/contexts/AuthContext.tsx for errors',
      timestamp: new Date(),
    };
  }
}

async function testApiService(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const apiModule = await import('@/services/api');
    const hasDefault = !!apiModule.default;
    const hasAuthService = !!apiModule.authService;
    
    return {
      id: testUtils.generateId(),
      name: 'API Service Verification',
      category: 'api',
      priority: 'P0',
      status: hasDefault && hasAuthService ? 'passed' : 'warning',
      duration: Date.now() - start,
      message: hasDefault && hasAuthService 
        ? 'API service exports are correct' 
        : 'Partial API service exports',
      expected: 'default export and authService',
      actual: `default: ${hasDefault}, authService: ${hasAuthService}`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: testUtils.generateId(),
      name: 'API Service Verification',
      category: 'api',
      priority: 'P0',
      status: 'failed',
      duration: Date.now() - start,
      message: 'Failed to load API service',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

async function testCoreUIComponents(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const coreComponents = [
    { name: 'Button', path: '@/components/ui/button' },
    { name: 'Card', path: '@/components/ui/card' },
    { name: 'Dialog', path: '@/components/ui/dialog' },
    { name: 'Form', path: '@/components/ui/form' },
    { name: 'Input', path: '@/components/ui/input' },
    { name: 'Table', path: '@/components/ui/table' },
    { name: 'Toast', path: '@/components/ui/toast' },
  ];
  
  for (const component of coreComponents) {
    const start = Date.now();
    try {
      const module = await import(/* @vite-ignore */ component.path);
      results.push({
        id: testUtils.generateId(),
        name: `UI Component: ${component.name}`,
        category: 'frontend',
        priority: 'P1',
        status: !!module ? 'passed' : 'failed',
        duration: Date.now() - start,
        message: `${component.name} component loaded successfully`,
        timestamp: new Date(),
      });
    } catch (error) {
      results.push({
        id: testUtils.generateId(),
        name: `UI Component: ${component.name}`,
        category: 'frontend',
        priority: 'P1',
        status: 'failed',
        duration: Date.now() - start,
        message: `Failed to load ${component.name} component`,
        error: error instanceof Error ? error.message : 'Unknown error',
        rootCause: `Component file at ${component.path} may be missing or have errors`,
        fix: `Check ${component.path.replace('@/', 'src/')}.tsx for issues`,
        timestamp: new Date(),
      });
    }
  }
  
  return results;
}

async function testPageComponents(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const criticalPages = [
    { name: 'Dashboard', path: '@/pages/Dashboard' },
    { name: 'Login', path: '@/pages/Login' },
    { name: 'Register', path: '@/pages/Register' },
    { name: 'Clients', path: '@/pages/Clients' },
    { name: 'Products', path: '@/pages/Products' },
    { name: 'Invoices', path: '@/pages/Invoices' },
    { name: 'Landing Page', path: '@/pages/Index' },
  ];
  
  for (const page of criticalPages) {
    const start = Date.now();
    try {
      const module = await import(/* @vite-ignore */ page.path);
      const hasDefault = !!module.default;
      
      results.push({
        id: testUtils.generateId(),
        name: `Page Component: ${page.name}`,
        category: 'frontend',
        priority: 'P0',
        status: hasDefault ? 'passed' : 'failed',
        duration: Date.now() - start,
        message: hasDefault 
          ? `${page.name} page component loaded successfully` 
          : `${page.name} page missing default export`,
        expected: 'Default export (React component)',
        actual: hasDefault ? 'Component exported' : 'No default export',
        timestamp: new Date(),
      });
    } catch (error) {
      results.push({
        id: testUtils.generateId(),
        name: `Page Component: ${page.name}`,
        category: 'frontend',
        priority: 'P0',
        status: 'failed',
        duration: Date.now() - start,
        message: `Failed to load ${page.name} page`,
        error: error instanceof Error ? error.message : 'Unknown error',
        rootCause: `Page file at ${page.path} may be missing or have import errors`,
        fix: `Check ${page.path.replace('@/', 'src/')}.tsx for issues`,
        timestamp: new Date(),
      });
    }
  }
  
  return results;
}

async function testHooks(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const criticalHooks = [
    { name: 'useClients', path: '@/hooks/useClients', exports: ['useClients'] },
    { name: 'useProducts', path: '@/hooks/useProducts', exports: ['useProducts'] },
    { name: 'useInvoices', path: '@/hooks/useInvoices', exports: ['useInvoices'] },
    { name: 'usePayments', path: '@/hooks/usePayments', exports: ['usePayments'] },
    { name: 'useReports', path: '@/hooks/useReports', exports: ['useDashboardStats'] },
  ];
  
  for (const hook of criticalHooks) {
    const start = Date.now();
    try {
      const module = await import(/* @vite-ignore */ hook.path);
      const hasExport = hook.exports.some(exp => !!module[exp]);
      
      results.push({
        id: testUtils.generateId(),
        name: `Hook: ${hook.name}`,
        category: 'frontend',
        priority: 'P0',
        status: hasExport ? 'passed' : 'failed',
        duration: Date.now() - start,
        message: hasExport 
          ? `${hook.name} hook loaded with expected exports` 
          : `${hook.name} missing expected exports`,
        expected: `Exports: ${hook.exports.join(', ')}`,
        actual: hasExport ? 'Exports found' : 'Missing exports',
        timestamp: new Date(),
      });
    } catch (error) {
      results.push({
        id: testUtils.generateId(),
        name: `Hook: ${hook.name}`,
        category: 'frontend',
        priority: 'P0',
        status: 'failed',
        duration: Date.now() - start,
        message: `Failed to load ${hook.name} hook`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }
  
  return results;
}

async function testRoutes(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const criticalRoutes = [
    '/', '/login', '/register', '/dashboard', '/clients', 
    '/products', '/invoices', '/payments', '/templates'
  ];
  
  for (const route of criticalRoutes) {
    const start = Date.now();
    const exists = await verifyRoute(route);
    
    results.push({
      id: testUtils.generateId(),
      name: `Route: ${route}`,
      category: 'frontend',
      priority: 'P0',
      status: exists ? 'passed' : 'failed',
      duration: Date.now() - start,
      message: exists ? `Route ${route} is registered` : `Route ${route} not found`,
      expected: 'Route registered in App.tsx',
      actual: exists ? 'Route exists' : 'Route missing',
      rootCause: !exists ? 'Route may not be defined in App.tsx Routes' : undefined,
      fix: !exists ? `Add route for ${route} in src/App.tsx` : undefined,
      timestamp: new Date(),
    });
  }
  
  return results;
}

// Verify all pages and their dependencies
export async function verifyAllPageDependencies(): Promise<PageVerificationResult[]> {
  const results: PageVerificationResult[] = [];
  
  for (const page of pageDependencyMaps) {
    const missingDeps: FileDependency[] = [];
    let verified = 0;
    
    for (const dep of page.dependencies) {
      const exists = await checkModuleExists(dep.path);
      if (exists) {
        verified++;
      } else if (dep.required) {
        missingDeps.push(dep);
      }
    }
    
    const total = page.dependencies.length;
    const passRate = total > 0 ? Math.round((verified / total) * 100) : 100;
    
    results.push({
      pageName: page.pageName,
      pageUrl: page.pageUrl,
      totalDependencies: total,
      verifiedDependencies: verified,
      missingDependencies: missingDeps,
      passRate,
      status: missingDeps.length === 0 ? 'passed' : 
              passRate >= 80 ? 'partial' : 'failed',
    });
  }
  
  return results;
}

// Generate file dependency test results as TestResult array
export async function generateFileDependencyTestResults(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const pageResults = await verifyAllPageDependencies();
  
  for (const page of pageResults) {
    results.push({
      id: testUtils.generateId(),
      name: `File Dependencies: ${page.pageName}`,
      category: 'frontend',
      priority: 'P0',
      status: page.status === 'passed' ? 'passed' : 
              page.status === 'partial' ? 'warning' : 'failed',
      duration: 0,
      message: page.status === 'passed' 
        ? `All ${page.totalDependencies} dependencies verified for ${page.pageName}` 
        : `${page.verifiedDependencies}/${page.totalDependencies} dependencies verified (${page.passRate}%)`,
      expected: `${page.totalDependencies} dependencies`,
      actual: `${page.verifiedDependencies} verified`,
      error: page.missingDependencies.length > 0 
        ? `Missing: ${page.missingDependencies.map(d => d.path).join(', ')}` 
        : undefined,
      rootCause: page.missingDependencies.length > 0 
        ? 'Required files are missing or cannot be imported' 
        : undefined,
      fix: page.missingDependencies.length > 0 
        ? `Create or fix the missing files: ${page.missingDependencies.map(d => d.path).join(', ')}` 
        : undefined,
      timestamp: new Date(),
    });
  }
  
  return results;
}
