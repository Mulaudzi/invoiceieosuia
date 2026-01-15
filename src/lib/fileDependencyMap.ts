// File Dependency Map for Ieosuia Invoices Application
// This file maps each page/feature to its required files for full functionality

export interface FileDependency {
  path: string;
  type: 'frontend' | 'backend' | 'config' | 'model' | 'hook' | 'service' | 'component' | 'middleware' | 'asset';
  required: boolean;
  description: string;
}

export interface PageDependencyMap {
  pageName: string;
  pageUrl: string;
  frontendFile: string;
  description: string;
  dependencies: FileDependency[];
  apiEndpoints: string[];
  backendControllers: string[];
  databaseTables: string[];
}

// Core application files required by all pages
export const coreFileDependencies: FileDependency[] = [
  // Entry Points
  { path: 'src/main.tsx', type: 'frontend', required: true, description: 'Application entry point' },
  { path: 'src/App.tsx', type: 'frontend', required: true, description: 'Main app component with routing' },
  { path: 'index.html', type: 'frontend', required: true, description: 'HTML entry point' },
  
  // Configuration
  { path: 'vite.config.ts', type: 'config', required: true, description: 'Vite configuration' },
  { path: 'tailwind.config.ts', type: 'config', required: true, description: 'Tailwind CSS configuration' },
  { path: 'src/index.css', type: 'asset', required: true, description: 'Global CSS styles' },
  
  // Authentication Context
  { path: 'src/contexts/AuthContext.tsx', type: 'frontend', required: true, description: 'Auth context provider' },
  { path: 'src/components/ProtectedRoute.tsx', type: 'component', required: true, description: 'Protected route wrapper' },
  
  // API Service
  { path: 'src/services/api.ts', type: 'service', required: true, description: 'API client and auth service' },
  
  // Backend Core
  { path: 'api/index.php', type: 'backend', required: true, description: 'API router entry point' },
  { path: 'api/core/Router.php', type: 'backend', required: true, description: 'Request router' },
  { path: 'api/core/Request.php', type: 'backend', required: true, description: 'Request handler' },
  { path: 'api/core/Response.php', type: 'backend', required: true, description: 'Response handler' },
  { path: 'api/core/Auth.php', type: 'backend', required: true, description: 'Authentication handler' },
  { path: 'api/core/Model.php', type: 'backend', required: true, description: 'Base model class' },
  { path: 'api/config/Database.php', type: 'config', required: true, description: 'Database configuration' },
  { path: 'api/middleware/AuthMiddleware.php', type: 'middleware', required: true, description: 'Auth middleware' },
  
  // UI Components (shadcn)
  { path: 'src/components/ui/button.tsx', type: 'component', required: true, description: 'Button component' },
  { path: 'src/components/ui/card.tsx', type: 'component', required: true, description: 'Card component' },
  { path: 'src/components/ui/dialog.tsx', type: 'component', required: true, description: 'Dialog component' },
  { path: 'src/components/ui/form.tsx', type: 'component', required: true, description: 'Form component' },
  { path: 'src/components/ui/input.tsx', type: 'component', required: true, description: 'Input component' },
  { path: 'src/components/ui/table.tsx', type: 'component', required: true, description: 'Table component' },
  { path: 'src/components/ui/toast.tsx', type: 'component', required: true, description: 'Toast component' },
  { path: 'src/components/ui/toaster.tsx', type: 'component', required: true, description: 'Toaster component' },
];

// Page-specific dependency maps
export const pageDependencyMaps: PageDependencyMap[] = [
  // ==================== AUTHENTICATION ====================
  {
    pageName: 'Login',
    pageUrl: '/login',
    frontendFile: 'src/pages/Login.tsx',
    description: 'User authentication page with email/password and Google OAuth',
    dependencies: [
      { path: 'src/pages/Login.tsx', type: 'frontend', required: true, description: 'Login page component' },
      { path: 'src/contexts/AuthContext.tsx', type: 'frontend', required: true, description: 'Auth context for login' },
      { path: 'src/hooks/useRecaptcha.ts', type: 'hook', required: true, description: 'reCAPTCHA hook' },
      { path: 'api/controllers/AuthController.php', type: 'backend', required: true, description: 'Auth controller' },
      { path: 'api/controllers/GoogleAuthController.php', type: 'backend', required: true, description: 'Google OAuth controller' },
      { path: 'api/core/Recaptcha.php', type: 'backend', required: true, description: 'reCAPTCHA verification' },
      { path: 'api/models/User.php', type: 'model', required: true, description: 'User model' },
    ],
    apiEndpoints: ['POST /login', 'GET /auth/google', 'POST /auth/google/callback'],
    backendControllers: ['AuthController', 'GoogleAuthController'],
    databaseTables: ['users', 'api_tokens', 'rate_limits'],
  },
  {
    pageName: 'Register',
    pageUrl: '/register',
    frontendFile: 'src/pages/Register.tsx',
    description: 'New user registration page',
    dependencies: [
      { path: 'src/pages/Register.tsx', type: 'frontend', required: true, description: 'Register page component' },
      { path: 'src/hooks/useRecaptcha.ts', type: 'hook', required: true, description: 'reCAPTCHA hook' },
      { path: 'api/controllers/AuthController.php', type: 'backend', required: true, description: 'Auth controller' },
      { path: 'api/core/EmailValidator.php', type: 'backend', required: true, description: 'Email validation' },
      { path: 'api/core/Mailer.php', type: 'backend', required: true, description: 'Email sending' },
      { path: 'api/config/disposable_domains.json', type: 'config', required: true, description: 'Disposable email domains list' },
    ],
    apiEndpoints: ['POST /register'],
    backendControllers: ['AuthController'],
    databaseTables: ['users', 'api_tokens', 'email_verification_tokens'],
  },
  {
    pageName: 'Google OAuth Callback',
    pageUrl: '/auth/google/callback',
    frontendFile: 'src/pages/GoogleCallback.tsx',
    description: 'Google OAuth callback handler',
    dependencies: [
      { path: 'src/pages/GoogleCallback.tsx', type: 'frontend', required: true, description: 'Google callback page' },
      { path: 'api/controllers/GoogleAuthController.php', type: 'backend', required: true, description: 'Google OAuth controller' },
    ],
    apiEndpoints: ['POST /auth/google/callback'],
    backendControllers: ['GoogleAuthController'],
    databaseTables: ['users', 'api_tokens'],
  },
  
  // ==================== DASHBOARD ====================
  {
    pageName: 'Dashboard',
    pageUrl: '/dashboard',
    frontendFile: 'src/pages/Dashboard.tsx',
    description: 'Main user dashboard with stats and recent activity',
    dependencies: [
      { path: 'src/pages/Dashboard.tsx', type: 'frontend', required: true, description: 'Dashboard page component' },
      { path: 'src/components/dashboard/DashboardHeader.tsx', type: 'component', required: true, description: 'Dashboard header' },
      { path: 'src/components/dashboard/DashboardSidebar.tsx', type: 'component', required: true, description: 'Dashboard sidebar' },
      { path: 'src/components/dashboard/StatCard.tsx', type: 'component', required: true, description: 'Statistics card' },
      { path: 'src/hooks/useReports.ts', type: 'hook', required: true, description: 'Reports data hook' },
      { path: 'src/hooks/useInvoices.ts', type: 'hook', required: true, description: 'Invoices data hook' },
      { path: 'src/hooks/useClients.ts', type: 'hook', required: true, description: 'Clients data hook' },
      { path: 'api/controllers/ReportController.php', type: 'backend', required: true, description: 'Reports controller' },
      { path: 'api/controllers/InvoiceController.php', type: 'backend', required: true, description: 'Invoice controller' },
      { path: 'api/controllers/ClientController.php', type: 'backend', required: true, description: 'Client controller' },
    ],
    apiEndpoints: ['GET /reports/dashboard', 'GET /invoices', 'GET /clients'],
    backendControllers: ['ReportController', 'InvoiceController', 'ClientController'],
    databaseTables: ['invoices', 'clients', 'payments', 'products'],
  },
  
  // ==================== CLIENTS ====================
  {
    pageName: 'Clients',
    pageUrl: '/clients',
    frontendFile: 'src/pages/Clients.tsx',
    description: 'Client management page',
    dependencies: [
      { path: 'src/pages/Clients.tsx', type: 'frontend', required: true, description: 'Clients page component' },
      { path: 'src/hooks/useClients.ts', type: 'hook', required: true, description: 'Clients data hook' },
      { path: 'src/hooks/useClientGroups.ts', type: 'hook', required: true, description: 'Client groups hook' },
      { path: 'src/components/clients/ClientModal.tsx', type: 'component', required: true, description: 'Client form modal' },
      { path: 'src/components/clients/DeleteClientDialog.tsx', type: 'component', required: true, description: 'Delete confirmation' },
      { path: 'src/components/clients/ClientGroupModal.tsx', type: 'component', required: true, description: 'Client group modal' },
      { path: 'src/components/clients/DeleteClientGroupDialog.tsx', type: 'component', required: true, description: 'Delete group dialog' },
      { path: 'src/services/clientGroupService.ts', type: 'service', required: true, description: 'Client group service' },
      { path: 'api/controllers/ClientController.php', type: 'backend', required: true, description: 'Client controller' },
      { path: 'api/controllers/ClientGroupController.php', type: 'backend', required: true, description: 'Client group controller' },
      { path: 'api/models/Client.php', type: 'model', required: true, description: 'Client model' },
      { path: 'api/models/ClientGroup.php', type: 'model', required: true, description: 'Client group model' },
    ],
    apiEndpoints: ['GET /clients', 'POST /clients', 'PUT /clients/{id}', 'DELETE /clients/{id}', 'GET /client-groups', 'POST /client-groups'],
    backendControllers: ['ClientController', 'ClientGroupController'],
    databaseTables: ['clients', 'client_groups'],
  },
  
  // ==================== PRODUCTS ====================
  {
    pageName: 'Products',
    pageUrl: '/products',
    frontendFile: 'src/pages/Products.tsx',
    description: 'Product/service management page',
    dependencies: [
      { path: 'src/pages/Products.tsx', type: 'frontend', required: true, description: 'Products page component' },
      { path: 'src/hooks/useProducts.ts', type: 'hook', required: true, description: 'Products data hook' },
      { path: 'src/components/products/ProductModal.tsx', type: 'component', required: true, description: 'Product form modal' },
      { path: 'src/components/products/DeleteProductDialog.tsx', type: 'component', required: true, description: 'Delete confirmation' },
      { path: 'api/controllers/ProductController.php', type: 'backend', required: true, description: 'Product controller' },
      { path: 'api/models/Product.php', type: 'model', required: true, description: 'Product model' },
    ],
    apiEndpoints: ['GET /products', 'POST /products', 'PUT /products/{id}', 'DELETE /products/{id}'],
    backendControllers: ['ProductController'],
    databaseTables: ['products'],
  },
  
  // ==================== INVOICES ====================
  {
    pageName: 'Invoices',
    pageUrl: '/invoices',
    frontendFile: 'src/pages/Invoices.tsx',
    description: 'Invoice management page',
    dependencies: [
      { path: 'src/pages/Invoices.tsx', type: 'frontend', required: true, description: 'Invoices page component' },
      { path: 'src/hooks/useInvoices.ts', type: 'hook', required: true, description: 'Invoices data hook' },
      { path: 'src/hooks/useCurrency.ts', type: 'hook', required: true, description: 'Currency formatting hook' },
      { path: 'src/components/invoices/InvoiceModal.tsx', type: 'component', required: true, description: 'Invoice form modal' },
      { path: 'src/components/invoices/DeleteInvoiceDialog.tsx', type: 'component', required: true, description: 'Delete confirmation' },
      { path: 'src/components/invoices/SendEmailDialog.tsx', type: 'component', required: true, description: 'Send email dialog' },
      { path: 'src/components/invoices/SendSmsDialog.tsx', type: 'component', required: true, description: 'Send SMS dialog' },
      { path: 'src/components/invoices/ScheduleReminderDialog.tsx', type: 'component', required: true, description: 'Schedule reminder dialog' },
      { path: 'src/components/invoices/InlineProductForm.tsx', type: 'component', required: true, description: 'Inline product form' },
      { path: 'api/controllers/InvoiceController.php', type: 'backend', required: true, description: 'Invoice controller' },
      { path: 'api/controllers/PdfController.php', type: 'backend', required: true, description: 'PDF generation controller' },
      { path: 'api/models/Invoice.php', type: 'model', required: true, description: 'Invoice model' },
      { path: 'api/models/InvoiceItem.php', type: 'model', required: true, description: 'Invoice item model' },
      { path: 'api/lib/FPDF.php', type: 'backend', required: true, description: 'PDF library' },
    ],
    apiEndpoints: ['GET /invoices', 'POST /invoices', 'PUT /invoices/{id}', 'DELETE /invoices/{id}', 'GET /invoices/{id}/pdf'],
    backendControllers: ['InvoiceController', 'PdfController'],
    databaseTables: ['invoices', 'invoice_items', 'clients', 'templates'],
  },
  
  // ==================== RECURRING INVOICES ====================
  {
    pageName: 'Recurring Invoices',
    pageUrl: '/recurring-invoices',
    frontendFile: 'src/pages/RecurringInvoices.tsx',
    description: 'Recurring invoice management',
    dependencies: [
      { path: 'src/pages/RecurringInvoices.tsx', type: 'frontend', required: true, description: 'Recurring invoices page' },
      { path: 'src/hooks/useRecurringInvoices.ts', type: 'hook', required: true, description: 'Recurring invoices hook' },
      { path: 'src/components/invoices/RecurringInvoiceModal.tsx', type: 'component', required: true, description: 'Recurring invoice modal' },
      { path: 'api/controllers/RecurringInvoiceController.php', type: 'backend', required: true, description: 'Recurring invoice controller' },
    ],
    apiEndpoints: ['GET /recurring-invoices', 'POST /recurring-invoices', 'PUT /recurring-invoices/{id}', 'DELETE /recurring-invoices/{id}'],
    backendControllers: ['RecurringInvoiceController'],
    databaseTables: ['recurring_invoices', 'clients'],
  },
  
  // ==================== PAYMENTS ====================
  {
    pageName: 'Payments',
    pageUrl: '/payments',
    frontendFile: 'src/pages/Payments.tsx',
    description: 'Payment tracking page',
    dependencies: [
      { path: 'src/pages/Payments.tsx', type: 'frontend', required: true, description: 'Payments page component' },
      { path: 'src/hooks/usePayments.ts', type: 'hook', required: true, description: 'Payments data hook' },
      { path: 'src/components/payments/PaymentModal.tsx', type: 'component', required: true, description: 'Payment form modal' },
      { path: 'src/components/payments/DeletePaymentDialog.tsx', type: 'component', required: true, description: 'Delete confirmation' },
      { path: 'api/controllers/PaymentController.php', type: 'backend', required: true, description: 'Payment controller' },
      { path: 'api/models/Payment.php', type: 'model', required: true, description: 'Payment model' },
    ],
    apiEndpoints: ['GET /payments', 'POST /payments', 'PUT /payments/{id}', 'DELETE /payments/{id}', 'GET /payments/summary'],
    backendControllers: ['PaymentController'],
    databaseTables: ['payments', 'invoices'],
  },
  
  // ==================== TEMPLATES ====================
  {
    pageName: 'Templates',
    pageUrl: '/templates',
    frontendFile: 'src/pages/Templates.tsx',
    description: 'Invoice template management',
    dependencies: [
      { path: 'src/pages/Templates.tsx', type: 'frontend', required: true, description: 'Templates page component' },
      { path: 'src/hooks/useTemplates.ts', type: 'hook', required: true, description: 'Templates data hook' },
      { path: 'src/components/templates/TemplateCard.tsx', type: 'component', required: true, description: 'Template card' },
      { path: 'src/components/templates/TemplateEditor.tsx', type: 'component', required: true, description: 'Template editor' },
      { path: 'src/components/templates/TemplatePresets.tsx', type: 'component', required: true, description: 'Template presets' },
      { path: 'src/lib/templatePresets.ts', type: 'frontend', required: true, description: 'Template preset data' },
      { path: 'api/controllers/TemplateController.php', type: 'backend', required: true, description: 'Template controller' },
      { path: 'api/models/Template.php', type: 'model', required: true, description: 'Template model' },
    ],
    apiEndpoints: ['GET /templates', 'POST /templates', 'PUT /templates/{id}', 'DELETE /templates/{id}'],
    backendControllers: ['TemplateController'],
    databaseTables: ['templates'],
  },
  
  // ==================== REPORTS ====================
  {
    pageName: 'Reports',
    pageUrl: '/reports',
    frontendFile: 'src/pages/Reports.tsx',
    description: 'Business reports and analytics',
    dependencies: [
      { path: 'src/pages/Reports.tsx', type: 'frontend', required: true, description: 'Reports page component' },
      { path: 'src/hooks/useReports.ts', type: 'hook', required: true, description: 'Reports data hook' },
      { path: 'src/components/exports/ExportDropdown.tsx', type: 'component', required: true, description: 'Export dropdown' },
      { path: 'src/lib/exportUtils.ts', type: 'frontend', required: true, description: 'Export utilities' },
      { path: 'api/controllers/ReportController.php', type: 'backend', required: true, description: 'Report controller' },
    ],
    apiEndpoints: ['GET /reports/summary', 'GET /reports/revenue', 'GET /reports/clients', 'GET /reports/invoices'],
    backendControllers: ['ReportController'],
    databaseTables: ['invoices', 'payments', 'clients'],
  },
  
  // ==================== REMINDERS ====================
  {
    pageName: 'Reminders',
    pageUrl: '/reminders',
    frontendFile: 'src/pages/Reminders.tsx',
    description: 'Invoice reminder management',
    dependencies: [
      { path: 'src/pages/Reminders.tsx', type: 'frontend', required: true, description: 'Reminders page component' },
      { path: 'src/hooks/useReminders.ts', type: 'hook', required: true, description: 'Reminders data hook' },
      { path: 'api/controllers/ReminderController.php', type: 'backend', required: true, description: 'Reminder controller' },
    ],
    apiEndpoints: ['GET /reminders', 'POST /reminders', 'PUT /reminders/{id}', 'DELETE /reminders/{id}'],
    backendControllers: ['ReminderController'],
    databaseTables: ['reminders', 'invoices'],
  },
  
  // ==================== PROFILE & SETTINGS ====================
  {
    pageName: 'Profile',
    pageUrl: '/profile',
    frontendFile: 'src/pages/Profile.tsx',
    description: 'User profile management',
    dependencies: [
      { path: 'src/pages/Profile.tsx', type: 'frontend', required: true, description: 'Profile page component' },
      { path: 'src/components/profile/AvatarUpload.tsx', type: 'component', required: true, description: 'Avatar upload' },
      { path: 'src/components/profile/LogoUpload.tsx', type: 'component', required: true, description: 'Business logo upload' },
      { path: 'src/components/profile/PasswordChange.tsx', type: 'component', required: true, description: 'Password change form' },
      { path: 'api/controllers/AuthController.php', type: 'backend', required: true, description: 'Auth controller for profile' },
    ],
    apiEndpoints: ['GET /user', 'PUT /user', 'POST /user/password', 'POST /user/avatar', 'POST /user/logo'],
    backendControllers: ['AuthController'],
    databaseTables: ['users'],
  },
  {
    pageName: 'Settings',
    pageUrl: '/settings',
    frontendFile: 'src/pages/Settings.tsx',
    description: 'Application settings',
    dependencies: [
      { path: 'src/pages/Settings.tsx', type: 'frontend', required: true, description: 'Settings page component' },
      { path: 'src/hooks/useCurrency.ts', type: 'hook', required: true, description: 'Currency settings hook' },
      { path: 'src/lib/currencies.ts', type: 'frontend', required: true, description: 'Currency data' },
      { path: 'api/controllers/CurrencyController.php', type: 'backend', required: true, description: 'Currency controller' },
    ],
    apiEndpoints: ['GET /currencies', 'PUT /user/settings'],
    backendControllers: ['CurrencyController', 'AuthController'],
    databaseTables: ['users', 'currencies'],
  },
  
  // ==================== SUBSCRIPTION & BILLING ====================
  {
    pageName: 'Subscription',
    pageUrl: '/subscription',
    frontendFile: 'src/pages/Subscription.tsx',
    description: 'Subscription management',
    dependencies: [
      { path: 'src/pages/Subscription.tsx', type: 'frontend', required: true, description: 'Subscription page' },
      { path: 'src/hooks/usePayfast.ts', type: 'hook', required: false, description: 'PayFast integration hook' },
      { path: 'src/hooks/usePaystack.ts', type: 'hook', required: false, description: 'Paystack integration hook' },
      { path: 'api/controllers/SubscriptionController.php', type: 'backend', required: true, description: 'Subscription controller' },
      { path: 'api/controllers/PayfastController.php', type: 'backend', required: false, description: 'PayFast controller' },
      { path: 'api/controllers/PaystackController.php', type: 'backend', required: false, description: 'Paystack controller' },
    ],
    apiEndpoints: ['GET /subscription', 'POST /subscription/upgrade', 'POST /subscription/cancel'],
    backendControllers: ['SubscriptionController', 'PayfastController', 'PaystackController'],
    databaseTables: ['subscriptions', 'payment_history', 'users'],
  },
  {
    pageName: 'Billing Portal',
    pageUrl: '/billing',
    frontendFile: 'src/pages/BillingPortal.tsx',
    description: 'Billing history and management',
    dependencies: [
      { path: 'src/pages/BillingPortal.tsx', type: 'frontend', required: true, description: 'Billing portal page' },
      { path: 'src/components/billing/PaymentRetryStatus.tsx', type: 'component', required: true, description: 'Payment retry status' },
      { path: 'src/hooks/usePaymentRetry.ts', type: 'hook', required: true, description: 'Payment retry hook' },
      { path: 'api/controllers/BillingController.php', type: 'backend', required: true, description: 'Billing controller' },
      { path: 'api/controllers/PaymentHistoryController.php', type: 'backend', required: true, description: 'Payment history controller' },
      { path: 'api/controllers/PaymentRetryController.php', type: 'backend', required: true, description: 'Payment retry controller' },
    ],
    apiEndpoints: ['GET /billing', 'GET /payment-history', 'POST /payment-retry'],
    backendControllers: ['BillingController', 'PaymentHistoryController', 'PaymentRetryController'],
    databaseTables: ['payment_history', 'subscriptions', 'users'],
  },
  
  // ==================== CREDITS ====================
  {
    pageName: 'Credits',
    pageUrl: '/credits',
    frontendFile: 'src/pages/Subscription.tsx',
    description: 'Credits system (SMS, emails)',
    dependencies: [
      { path: 'src/components/credits/CreditsDisplay.tsx', type: 'component', required: true, description: 'Credits display' },
      { path: 'src/components/credits/CreditsWidget.tsx', type: 'component', required: true, description: 'Credits widget' },
      { path: 'src/hooks/useCredits.ts', type: 'hook', required: true, description: 'Credits data hook' },
      { path: 'src/hooks/useCreditCheck.ts', type: 'hook', required: true, description: 'Credit check hook' },
      { path: 'api/controllers/CreditsController.php', type: 'backend', required: true, description: 'Credits controller' },
    ],
    apiEndpoints: ['GET /credits/balance', 'GET /credits/usage', 'POST /credits/purchase'],
    backendControllers: ['CreditsController'],
    databaseTables: ['credits_usage', 'credits_transactions', 'users'],
  },
  
  // ==================== NOTIFICATIONS ====================
  {
    pageName: 'Notification History',
    pageUrl: '/notifications',
    frontendFile: 'src/pages/NotificationHistory.tsx',
    description: 'Notification history and management',
    dependencies: [
      { path: 'src/pages/NotificationHistory.tsx', type: 'frontend', required: true, description: 'Notification history page' },
      { path: 'src/hooks/useNotifications.ts', type: 'hook', required: true, description: 'Notifications data hook' },
      { path: 'api/controllers/NotificationController.php', type: 'backend', required: true, description: 'Notification controller' },
      { path: 'api/controllers/UserNotificationController.php', type: 'backend', required: true, description: 'User notification controller' },
    ],
    apiEndpoints: ['GET /notifications', 'PUT /notifications/{id}/read', 'DELETE /notifications/{id}'],
    backendControllers: ['NotificationController', 'UserNotificationController'],
    databaseTables: ['user_notifications', 'notification_logs'],
  },
  
  // ==================== EMAIL TEMPLATES ====================
  {
    pageName: 'Email Templates',
    pageUrl: '/email-templates',
    frontendFile: 'src/pages/EmailTemplates.tsx',
    description: 'Email/SMS template management',
    dependencies: [
      { path: 'src/pages/EmailTemplates.tsx', type: 'frontend', required: true, description: 'Email templates page' },
      { path: 'src/hooks/useMessageTemplates.ts', type: 'hook', required: true, description: 'Message templates hook' },
      { path: 'src/services/messageTemplateService.ts', type: 'service', required: true, description: 'Message template service' },
      { path: 'api/controllers/MessageTemplateController.php', type: 'backend', required: true, description: 'Message template controller' },
      { path: 'api/models/MessageTemplate.php', type: 'model', required: true, description: 'Message template model' },
    ],
    apiEndpoints: ['GET /message-templates', 'POST /message-templates', 'PUT /message-templates/{id}', 'DELETE /message-templates/{id}'],
    backendControllers: ['MessageTemplateController'],
    databaseTables: ['message_templates'],
  },
  
  // ==================== ADMIN PAGES ====================
  {
    pageName: 'Admin Dashboard',
    pageUrl: '/admin',
    frontendFile: 'src/pages/admin/AdminDashboard.tsx',
    description: 'Admin control panel dashboard',
    dependencies: [
      { path: 'src/pages/admin/AdminIndex.tsx', type: 'frontend', required: true, description: 'Admin index' },
      { path: 'src/pages/admin/AdminDashboard.tsx', type: 'frontend', required: true, description: 'Admin dashboard' },
      { path: 'src/pages/admin/AdminLogin.tsx', type: 'frontend', required: true, description: 'Admin login' },
      { path: 'src/components/admin/AdminLayout.tsx', type: 'component', required: true, description: 'Admin layout' },
      { path: 'src/components/admin/AdminSidebar.tsx', type: 'component', required: true, description: 'Admin sidebar' },
      { path: 'api/controllers/AdminController.php', type: 'backend', required: true, description: 'Admin controller' },
    ],
    apiEndpoints: ['POST /admin/login', 'GET /admin/dashboard', 'GET /admin/users', 'GET /admin/subscriptions'],
    backendControllers: ['AdminController'],
    databaseTables: ['users', 'admin_sessions', 'admin_login_attempts'],
  },
  {
    pageName: 'Admin Users',
    pageUrl: '/admin/users',
    frontendFile: 'src/pages/admin/AdminUsers.tsx',
    description: 'Admin user management',
    dependencies: [
      { path: 'src/pages/admin/AdminUsers.tsx', type: 'frontend', required: true, description: 'Admin users page' },
      { path: 'api/controllers/AdminController.php', type: 'backend', required: true, description: 'Admin controller' },
    ],
    apiEndpoints: ['GET /admin/users', 'PUT /admin/users/{id}', 'DELETE /admin/users/{id}'],
    backendControllers: ['AdminController'],
    databaseTables: ['users'],
  },
  {
    pageName: 'Admin Subscriptions',
    pageUrl: '/admin/subscriptions',
    frontendFile: 'src/pages/admin/AdminSubscriptions.tsx',
    description: 'Admin subscription management',
    dependencies: [
      { path: 'src/pages/admin/AdminSubscriptions.tsx', type: 'frontend', required: true, description: 'Admin subscriptions page' },
      { path: 'api/controllers/AdminController.php', type: 'backend', required: true, description: 'Admin controller' },
    ],
    apiEndpoints: ['GET /admin/subscriptions'],
    backendControllers: ['AdminController'],
    databaseTables: ['subscriptions', 'users'],
  },
  {
    pageName: 'Admin Activity Logs',
    pageUrl: '/admin/activity',
    frontendFile: 'src/pages/admin/AdminActivityLogs.tsx',
    description: 'Admin activity logging',
    dependencies: [
      { path: 'src/pages/admin/AdminActivityLogs.tsx', type: 'frontend', required: true, description: 'Admin activity logs page' },
      { path: 'api/core/AdminActivityLogger.php', type: 'backend', required: true, description: 'Admin activity logger' },
    ],
    apiEndpoints: ['GET /admin/activity-logs'],
    backendControllers: ['AdminController'],
    databaseTables: ['admin_activity_logs'],
  },
  {
    pageName: 'Admin Email Logs',
    pageUrl: '/admin/emails',
    frontendFile: 'src/pages/admin/AdminEmailLogs.tsx',
    description: 'Admin email logs',
    dependencies: [
      { path: 'src/pages/admin/AdminEmailLogs.tsx', type: 'frontend', required: true, description: 'Admin email logs page' },
    ],
    apiEndpoints: ['GET /admin/email-logs'],
    backendControllers: ['AdminController'],
    databaseTables: ['email_logs'],
  },
  {
    pageName: 'Admin Settings',
    pageUrl: '/admin/settings',
    frontendFile: 'src/pages/admin/AdminSettings.tsx',
    description: 'Admin application settings',
    dependencies: [
      { path: 'src/pages/admin/AdminSettings.tsx', type: 'frontend', required: true, description: 'Admin settings page' },
    ],
    apiEndpoints: ['GET /admin/settings', 'PUT /admin/settings'],
    backendControllers: ['AdminController'],
    databaseTables: ['settings'],
  },
  {
    pageName: 'Admin QA Console',
    pageUrl: '/admin/qa',
    frontendFile: 'src/pages/admin/AdminQaConsole.tsx',
    description: 'Admin QA testing console',
    dependencies: [
      { path: 'src/pages/admin/AdminQaConsole.tsx', type: 'frontend', required: true, description: 'Admin QA console page' },
      { path: 'api/controllers/QaController.php', type: 'backend', required: true, description: 'QA controller' },
    ],
    apiEndpoints: ['POST /qa/test', 'GET /qa/status'],
    backendControllers: ['QaController'],
    databaseTables: [],
  },
  
  // ==================== STATIC PAGES ====================
  {
    pageName: 'Landing Page',
    pageUrl: '/',
    frontendFile: 'src/pages/Index.tsx',
    description: 'Public landing page',
    dependencies: [
      { path: 'src/pages/Index.tsx', type: 'frontend', required: true, description: 'Landing page component' },
      { path: 'src/components/landing/Navbar.tsx', type: 'component', required: true, description: 'Navigation bar' },
      { path: 'src/components/landing/HeroSection.tsx', type: 'component', required: true, description: 'Hero section' },
      { path: 'src/components/landing/FeaturesSection.tsx', type: 'component', required: true, description: 'Features section' },
      { path: 'src/components/landing/HowItWorksSection.tsx', type: 'component', required: true, description: 'How it works' },
      { path: 'src/components/landing/PricingSection.tsx', type: 'component', required: true, description: 'Pricing section' },
      { path: 'src/components/landing/PricingFAQ.tsx', type: 'component', required: true, description: 'Pricing FAQ' },
      { path: 'src/components/landing/TestimonialsSection.tsx', type: 'component', required: true, description: 'Testimonials' },
      { path: 'src/components/landing/ContactSection.tsx', type: 'component', required: true, description: 'Contact section' },
      { path: 'src/components/landing/Footer.tsx', type: 'component', required: true, description: 'Footer' },
      { path: 'src/components/landing/ScrollToTop.tsx', type: 'component', required: true, description: 'Scroll to top button' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Contact',
    pageUrl: '/contact',
    frontendFile: 'src/pages/Contact.tsx',
    description: 'Contact form page',
    dependencies: [
      { path: 'src/pages/Contact.tsx', type: 'frontend', required: true, description: 'Contact page component' },
      { path: 'src/components/landing/PageHeader.tsx', type: 'component', required: true, description: 'Page header' },
      { path: 'api/controllers/ContactController.php', type: 'backend', required: true, description: 'Contact controller' },
    ],
    apiEndpoints: ['POST /contact'],
    backendControllers: ['ContactController'],
    databaseTables: ['contact_submissions'],
  },
  {
    pageName: 'FAQ',
    pageUrl: '/faq',
    frontendFile: 'src/pages/FAQ.tsx',
    description: 'Frequently asked questions',
    dependencies: [
      { path: 'src/pages/FAQ.tsx', type: 'frontend', required: true, description: 'FAQ page component' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Documentation',
    pageUrl: '/docs',
    frontendFile: 'src/pages/Documentation.tsx',
    description: 'Application documentation',
    dependencies: [
      { path: 'src/pages/Documentation.tsx', type: 'frontend', required: true, description: 'Documentation page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Support',
    pageUrl: '/support',
    frontendFile: 'src/pages/Support.tsx',
    description: 'Support center page',
    dependencies: [
      { path: 'src/pages/Support.tsx', type: 'frontend', required: true, description: 'Support page component' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  
  // ==================== LEGAL PAGES ====================
  {
    pageName: 'Privacy Policy',
    pageUrl: '/privacy',
    frontendFile: 'src/pages/PrivacyPolicy.tsx',
    description: 'Privacy policy page',
    dependencies: [
      { path: 'src/pages/PrivacyPolicy.tsx', type: 'frontend', required: true, description: 'Privacy policy page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Terms of Service',
    pageUrl: '/terms',
    frontendFile: 'src/pages/TermsOfService.tsx',
    description: 'Terms of service page',
    dependencies: [
      { path: 'src/pages/TermsOfService.tsx', type: 'frontend', required: true, description: 'Terms of service page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Cookie Policy',
    pageUrl: '/cookies',
    frontendFile: 'src/pages/CookiePolicy.tsx',
    description: 'Cookie policy page',
    dependencies: [
      { path: 'src/pages/CookiePolicy.tsx', type: 'frontend', required: true, description: 'Cookie policy page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'POPIA Compliance',
    pageUrl: '/popia',
    frontendFile: 'src/pages/PopiaCompliance.tsx',
    description: 'POPIA compliance information',
    dependencies: [
      { path: 'src/pages/PopiaCompliance.tsx', type: 'frontend', required: true, description: 'POPIA compliance page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  
  // ==================== UTILITY PAGES ====================
  {
    pageName: 'Verify Email',
    pageUrl: '/verify-email',
    frontendFile: 'src/pages/VerifyEmail.tsx',
    description: 'Email verification page',
    dependencies: [
      { path: 'src/pages/VerifyEmail.tsx', type: 'frontend', required: true, description: 'Email verification page' },
      { path: 'api/controllers/AuthController.php', type: 'backend', required: true, description: 'Auth controller' },
    ],
    apiEndpoints: ['POST /verify-email'],
    backendControllers: ['AuthController'],
    databaseTables: ['email_verification_tokens', 'users'],
  },
  {
    pageName: 'Forgot Password',
    pageUrl: '/forgot-password',
    frontendFile: 'src/pages/ForgotPassword.tsx',
    description: 'Password reset request page',
    dependencies: [
      { path: 'src/pages/ForgotPassword.tsx', type: 'frontend', required: true, description: 'Forgot password page' },
      { path: 'api/controllers/AuthController.php', type: 'backend', required: true, description: 'Auth controller' },
      { path: 'api/core/Mailer.php', type: 'backend', required: true, description: 'Email sending' },
    ],
    apiEndpoints: ['POST /forgot-password'],
    backendControllers: ['AuthController'],
    databaseTables: ['password_reset_tokens', 'users'],
  },
  {
    pageName: 'Reset Password',
    pageUrl: '/reset-password',
    frontendFile: 'src/pages/ResetPassword.tsx',
    description: 'Password reset form page',
    dependencies: [
      { path: 'src/pages/ResetPassword.tsx', type: 'frontend', required: true, description: 'Reset password page' },
      { path: 'api/controllers/AuthController.php', type: 'backend', required: true, description: 'Auth controller' },
    ],
    apiEndpoints: ['POST /reset-password'],
    backendControllers: ['AuthController'],
    databaseTables: ['password_reset_tokens', 'users'],
  },
  {
    pageName: 'Payment Success',
    pageUrl: '/payment/success',
    frontendFile: 'src/pages/PaymentSuccess.tsx',
    description: 'Payment success confirmation',
    dependencies: [
      { path: 'src/pages/PaymentSuccess.tsx', type: 'frontend', required: true, description: 'Payment success page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Payment Failed',
    pageUrl: '/payment/failed',
    frontendFile: 'src/pages/PaymentFailed.tsx',
    description: 'Payment failure page',
    dependencies: [
      { path: 'src/pages/PaymentFailed.tsx', type: 'frontend', required: true, description: 'Payment failed page' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  {
    pageName: 'Not Found',
    pageUrl: '*',
    frontendFile: 'src/pages/NotFound.tsx',
    description: '404 error page',
    dependencies: [
      { path: 'src/pages/NotFound.tsx', type: 'frontend', required: true, description: '404 page component' },
    ],
    apiEndpoints: [],
    backendControllers: [],
    databaseTables: [],
  },
  
  // ==================== TEST PAGES ====================
  {
    pageName: 'Automated Tests',
    pageUrl: '/tests',
    frontendFile: 'src/pages/AutomatedTests.tsx',
    description: 'Automated system testing dashboard',
    dependencies: [
      { path: 'src/pages/AutomatedTests.tsx', type: 'frontend', required: true, description: 'Automated tests page' },
      { path: 'src/lib/testRunner.ts', type: 'frontend', required: true, description: 'Test runner engine' },
      { path: 'src/lib/fileDependencyMap.ts', type: 'frontend', required: true, description: 'File dependency mapping' },
    ],
    apiEndpoints: ['GET /health', 'All authenticated endpoints'],
    backendControllers: ['HealthController', 'All controllers'],
    databaseTables: ['All tables for CRUD testing'],
  },
];

// Get all unique files from the dependency maps
export function getAllRequiredFiles(): FileDependency[] {
  const fileMap = new Map<string, FileDependency>();
  
  // Add core dependencies
  coreFileDependencies.forEach(dep => {
    fileMap.set(dep.path, dep);
  });
  
  // Add page-specific dependencies
  pageDependencyMaps.forEach(page => {
    page.dependencies.forEach(dep => {
      if (!fileMap.has(dep.path)) {
        fileMap.set(dep.path, dep);
      }
    });
  });
  
  return Array.from(fileMap.values());
}

// Get dependencies for a specific page
export function getPageDependencies(pageUrl: string): PageDependencyMap | undefined {
  return pageDependencyMaps.find(p => p.pageUrl === pageUrl);
}

// Generate application structure documentation
export function generateAppStructureDoc(): string {
  const appName = 'Ieosuia Invoices';
  const timestamp = new Date().toISOString();
  
  let doc = `# ${appName} Application Structure\n\n`;
  doc += `**Generated:** ${timestamp}\n`;
  doc += `**Purpose:** Complete file dependency map for production-readiness verification\n\n`;
  doc += `---\n\n`;
  
  // Core Files Section
  doc += `## Core Application Files\n\n`;
  doc += `These files are required by all pages for the application to function:\n\n`;
  doc += `| File Path | Type | Required | Description |\n`;
  doc += `|-----------|------|----------|-------------|\n`;
  coreFileDependencies.forEach(dep => {
    doc += `| \`${dep.path}\` | ${dep.type} | ${dep.required ? '✅' : '⚠️'} | ${dep.description} |\n`;
  });
  doc += `\n---\n\n`;
  
  // Page-Specific Dependencies
  doc += `## Page-Specific Dependencies\n\n`;
  
  pageDependencyMaps.forEach(page => {
    doc += `### ${page.pageName}\n\n`;
    doc += `- **URL:** \`${page.pageUrl}\`\n`;
    doc += `- **Main File:** \`${page.frontendFile}\`\n`;
    doc += `- **Description:** ${page.description}\n\n`;
    
    if (page.dependencies.length > 0) {
      doc += `**Dependencies:**\n\n`;
      doc += `| File Path | Type | Required | Description |\n`;
      doc += `|-----------|------|----------|-------------|\n`;
      page.dependencies.forEach(dep => {
        doc += `| \`${dep.path}\` | ${dep.type} | ${dep.required ? '✅' : '⚠️'} | ${dep.description} |\n`;
      });
      doc += `\n`;
    }
    
    if (page.apiEndpoints.length > 0) {
      doc += `**API Endpoints:** ${page.apiEndpoints.join(', ')}\n\n`;
    }
    
    if (page.backendControllers.length > 0) {
      doc += `**Backend Controllers:** ${page.backendControllers.join(', ')}\n\n`;
    }
    
    if (page.databaseTables.length > 0) {
      doc += `**Database Tables:** ${page.databaseTables.join(', ')}\n\n`;
    }
    
    doc += `---\n\n`;
  });
  
  // Summary Statistics
  const allFiles = getAllRequiredFiles();
  const stats = {
    total: allFiles.length,
    frontend: allFiles.filter(f => f.type === 'frontend').length,
    backend: allFiles.filter(f => f.type === 'backend').length,
    component: allFiles.filter(f => f.type === 'component').length,
    hook: allFiles.filter(f => f.type === 'hook').length,
    service: allFiles.filter(f => f.type === 'service').length,
    model: allFiles.filter(f => f.type === 'model').length,
    config: allFiles.filter(f => f.type === 'config').length,
    middleware: allFiles.filter(f => f.type === 'middleware').length,
    asset: allFiles.filter(f => f.type === 'asset').length,
  };
  
  doc += `## Summary Statistics\n\n`;
  doc += `| Category | Count |\n`;
  doc += `|----------|-------|\n`;
  doc += `| Total Files | ${stats.total} |\n`;
  doc += `| Frontend Files | ${stats.frontend} |\n`;
  doc += `| Backend Files | ${stats.backend} |\n`;
  doc += `| Components | ${stats.component} |\n`;
  doc += `| Hooks | ${stats.hook} |\n`;
  doc += `| Services | ${stats.service} |\n`;
  doc += `| Models | ${stats.model} |\n`;
  doc += `| Config Files | ${stats.config} |\n`;
  doc += `| Middleware | ${stats.middleware} |\n`;
  doc += `| Assets | ${stats.asset} |\n`;
  doc += `\n`;
  doc += `**Total Pages Mapped:** ${pageDependencyMaps.length}\n`;
  
  return doc;
}
