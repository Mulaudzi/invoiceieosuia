<?php

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Load environment variables before applying configuration-dependent headers.
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
            (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
            $value = substr($value, 1, -1);
        }
        $_ENV[$key] = $value;
    }
}

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS headers: only echo explicitly configured browser origins.
$configuredOrigins = array_filter(array_map('trim', explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'https://invoices.ieosuia.com')));
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '' && in_array($requestOrigin, $configuredOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Core includes
require_once __DIR__ . '/core/EmailValidator.php';

// Autoload classes
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/core/',
        __DIR__ . '/config/',
        __DIR__ . '/models/',
        __DIR__ . '/controllers/',
        __DIR__ . '/middleware/',
    ];
    
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Initialize router
$router = new Router();
$router->get('/auth/ieosuia/start', [IeosuiaAuthController::class, 'start']);
$router->get('/auth/ieosuia/callback', [IeosuiaAuthController::class, 'callback']);

// Health check routes (public)
$router->get('/health', [HealthController::class, 'check']);
$router->get('/health/debug', [HealthController::class, 'debug']);

// Public routes
$router->post('/register', [IeosuiaAuthController::class, 'disabled']);
$router->post('/login', [IeosuiaAuthController::class, 'disabled']);
$router->post('/verify-email', [IeosuiaAuthController::class, 'disabled']);
$router->post('/forgot-password', [IeosuiaAuthController::class, 'disabled']);
$router->post('/reset-password', [IeosuiaAuthController::class, 'disabled']);

// Admin setup route (temporary - disable after initial setup)
$router->post('/guymhan/setup', [IeosuiaAuthController::class, 'disabled']);

// Admin email check (public - for login page detection)
$router->post('/guymhan/check-email', [AuthController::class, 'checkAdminEmail']);

// Admin batch login (all 3 passwords at once)
$router->post('/guymhan/login/batch', [IeosuiaAuthController::class, 'disabled']);
$router->post('/guymhan/login/pin', [IeosuiaAuthController::class, 'disabled']);

// Protected routes
$router->post('/logout', [AuthController::class, 'logout'], [AuthMiddleware::class]);
$router->get('/user', [AuthController::class, 'user'], [AuthMiddleware::class]);
$router->put('/profile', [AuthController::class, 'updateProfile'], [AuthMiddleware::class]);
$router->put('/password', [IeosuiaAuthController::class, 'disabled'], [AuthMiddleware::class]);
$router->post('/avatar', [AuthController::class, 'uploadAvatar'], [AuthMiddleware::class]);
$router->delete('/avatar', [AuthController::class, 'deleteAvatar'], [AuthMiddleware::class]);
$router->post('/resend-verification', [AuthController::class, 'resendVerification'], [AuthMiddleware::class]);
$router->post('/upload-logo', [AuthController::class, 'uploadLogo'], [AuthMiddleware::class]);
$router->post('/upload-invoice-logo', [AuthController::class, 'uploadInvoiceLogo'], [AuthMiddleware::class]);
$router->get('/media/{type}/{filename}', [MediaController::class, 'show'], [AuthMiddleware::class]);
$router->delete('/logo', [AuthController::class, 'deleteLogo'], [AuthMiddleware::class]);

// Clients
$router->get('/clients', [ClientController::class, 'index'], [AuthMiddleware::class]);
$router->post('/clients', [ClientController::class, 'store'], [AuthMiddleware::class]);
$router->get('/clients/{id}', [ClientController::class, 'show'], [AuthMiddleware::class]);
$router->put('/clients/{id}', [ClientController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/clients/{id}', [ClientController::class, 'destroy'], [AuthMiddleware::class]);

// Client Groups
$router->get('/client-groups', [ClientGroupController::class, 'index'], [AuthMiddleware::class]);
$router->post('/client-groups', [ClientGroupController::class, 'store'], [AuthMiddleware::class]);
$router->get('/client-groups/{id}', [ClientGroupController::class, 'show'], [AuthMiddleware::class]);
$router->put('/client-groups/{id}', [ClientGroupController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/client-groups/{id}', [ClientGroupController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/client-groups/{id}/assign', [ClientGroupController::class, 'assignClients'], [AuthMiddleware::class]);
$router->post('/client-groups/{id}/remove', [ClientGroupController::class, 'removeClients'], [AuthMiddleware::class]);

// Products
$router->get('/products', [ProductController::class, 'index'], [AuthMiddleware::class]);
$router->get('/products/categories', [ProductController::class, 'categories'], [AuthMiddleware::class]);
$router->post('/products', [ProductController::class, 'store'], [AuthMiddleware::class]);
$router->get('/products/{id}', [ProductController::class, 'show'], [AuthMiddleware::class]);
$router->put('/products/{id}', [ProductController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/products/{id}', [ProductController::class, 'destroy'], [AuthMiddleware::class]);

// Invoices
$router->get('/invoices', [InvoiceController::class, 'index'], [AuthMiddleware::class]);
$router->post('/invoices', [InvoiceController::class, 'store'], [AuthMiddleware::class]);
$router->get('/invoices/{id}', [InvoiceController::class, 'show'], [AuthMiddleware::class]);
$router->put('/invoices/{id}', [InvoiceController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/invoices/{id}', [InvoiceController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid'], [AuthMiddleware::class]);
$router->post('/invoices/{id}/payments', [InvoiceController::class, 'recordPayment'], [AuthMiddleware::class]);
$router->post('/invoices/{id}/issue', [InvoiceController::class, 'issue'], [AuthMiddleware::class]);
$router->put('/invoices/{id}/payments/{paymentId}', [InvoiceController::class, 'updatePayment'], [AuthMiddleware::class]);
$router->delete('/invoices/{id}/payments/{paymentId}', [InvoiceController::class, 'voidPayment'], [AuthMiddleware::class]);

// Reports
$router->get('/reports/dashboard', [ReportController::class, 'dashboard'], [AuthMiddleware::class]);
$router->get('/reports/monthly-revenue', [ReportController::class, 'monthlyRevenue'], [AuthMiddleware::class]);
$router->get('/reports/invoice-status', [ReportController::class, 'invoiceStatus'], [AuthMiddleware::class]);
$router->get('/reports/top-clients', [ReportController::class, 'topClients'], [AuthMiddleware::class]);
$router->get('/reports/income-expense', [ReportController::class, 'incomeExpense'], [AuthMiddleware::class]);
$router->get('/reports/recent-invoices', [ReportController::class, 'recentInvoices'], [AuthMiddleware::class]);
$router->get('/reports/extended-stats', [ReportController::class, 'extendedStats'], [AuthMiddleware::class]);
$router->get('/reports/monthly-stats', [ReportController::class, 'monthlyStats'], [AuthMiddleware::class]);
$router->get('/reports/summary', [ReportController::class, 'summary'], [AuthMiddleware::class]);
$router->get('/reports/export', [ReportController::class, 'export'], [AuthMiddleware::class]);

// Templates (Invoice)
$router->get('/templates', [TemplateController::class, 'index'], [AuthMiddleware::class]);
$router->post('/templates', [TemplateController::class, 'store'], [AuthMiddleware::class]);
$router->get('/templates/{id}', [TemplateController::class, 'show'], [AuthMiddleware::class]);
$router->put('/templates/{id}', [TemplateController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/templates/{id}', [TemplateController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/templates/{id}/set-default', [TemplateController::class, 'setDefault'], [AuthMiddleware::class]);
$router->get('/templates/system/all', [TemplateController::class, 'getSystemTemplates']);
$router->post('/templates/guymhan/seed', [TemplateController::class, 'seedDefaultTemplates'], [AdminAuthMiddleware::class]);

// PDF Generation
$router->get('/invoices/{id}/pdf', [PdfController::class, 'generate'], [AuthMiddleware::class]);
$router->get('/invoices/{id}/pdf/download', [PdfController::class, 'download'], [AuthMiddleware::class]);

// GDPR Routes
$router->get('/gdpr/export', [GdprController::class, 'export'], [AuthMiddleware::class]);
$router->delete('/gdpr/delete', [GdprController::class, 'delete'], [AuthMiddleware::class]);

// Currency Routes
$router->get('/currencies', [CurrencyController::class, 'index']);
$router->get('/currencies/rates', [CurrencyController::class, 'rates']);
$router->post('/currencies/convert', [CurrencyController::class, 'convert']);
$router->post('/currencies/update-rates', [CurrencyController::class, 'updateRates'], [AuthMiddleware::class]);

// Recurring Invoice Routes
$router->get('/recurring-invoices', [RecurringInvoiceController::class, 'getAll'], [AuthMiddleware::class]);
$router->get('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'getById'], [AuthMiddleware::class]);
$router->post('/recurring-invoices', [RecurringInvoiceController::class, 'create'], [AuthMiddleware::class]);
$router->put('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'delete'], [AuthMiddleware::class]);
$router->patch('/recurring-invoices/{id}/status', [RecurringInvoiceController::class, 'updateStatus'], [AuthMiddleware::class]);

// Contact Form Route (public with rate limiting)
$router->post('/contact', [ContactController::class, 'submit']);

// Admin authentication
$router->post('/guymhan/logout', [AdminController::class, 'logout']);

// Admin Protected Routes
$router->get('/guymhan/dashboard', [AdminController::class, 'getDashboard'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/system', [AdminSystemController::class, 'index'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/submissions', [AdminController::class, 'getSubmissions'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/submissions/{id}', [AdminController::class, 'getSubmission'], [AdminAuthMiddleware::class]);
$router->put('/guymhan/submissions/{id}', [AdminController::class, 'updateSubmission'], [AdminAuthMiddleware::class]);
$router->delete('/guymhan/submissions/{id}', [AdminController::class, 'deleteSubmission'], [AdminAuthMiddleware::class]);
$router->post('/guymhan/submissions/{id}/read', [AdminController::class, 'markAsRead'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/email-logs', [AdminController::class, 'getEmailLogs'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/notification-settings', [AdminController::class, 'getNotificationSettings'], [AdminAuthMiddleware::class]);
$router->put('/guymhan/notification-settings', [AdminController::class, 'updateNotificationSettings'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/export/email-logs', [AdminController::class, 'exportEmailLogs'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/export/submissions', [AdminController::class, 'exportSubmissions'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/reports/statistics', [AdminController::class, 'getStatisticsReport'], [AdminAuthMiddleware::class]);

// Admin Activity Logs Routes
$router->get('/guymhan/activity-logs', [AdminController::class, 'getActivityLogs'], [AdminAuthMiddleware::class]);
$router->get('/guymhan/export/activity-logs', [AdminController::class, 'exportActivityLogs'], [AdminAuthMiddleware::class]);

// Admin Session Management Routes
$router->get('/guymhan/sessions', [AdminController::class, 'getActiveSessions'], [AdminAuthMiddleware::class]);
$router->delete('/guymhan/sessions/{id}', [AdminController::class, 'terminateSession'], [AdminAuthMiddleware::class]);
$router->delete('/guymhan/sessions', [AdminController::class, 'terminateAllSessions'], [AdminAuthMiddleware::class]);

// Admin User Management Routes
$router->get('/guymhan/users', [AuthController::class, 'getAdminUsers'], [AdminAuthMiddleware::class]);
$router->put('/guymhan/pin', [AuthController::class, 'changeAdminPin'], [AdminAuthMiddleware::class]);
$router->post('/guymhan/users', [AuthController::class, 'createAdminUser'], [AdminAuthMiddleware::class]);
$router->put('/guymhan/users/{id}', [AuthController::class, 'updateAdminUser'], [AdminAuthMiddleware::class]);
$router->patch('/guymhan/users/{id}/toggle', [AuthController::class, 'toggleAdminStatus'], [AdminAuthMiddleware::class]);
$router->delete('/guymhan/users/{id}', [AuthController::class, 'deleteAdminUser'], [AdminAuthMiddleware::class]);

// Settings Routes (Admin only)
$router->get('/settings', [SettingsController::class, 'getSettings'], [AdminAuthMiddleware::class]);
$router->post('/settings/batch', [SettingsController::class, 'batchUpdateSettings'], [AdminAuthMiddleware::class]);
$router->get('/settings/mail', [SettingsController::class, 'getMailSettings'], [AdminAuthMiddleware::class]);
$router->put('/settings/mail', [SettingsController::class, 'updateMailSettings'], [AdminAuthMiddleware::class]);
$router->post('/settings/reset', [SettingsController::class, 'resetToDefaults'], [AdminAuthMiddleware::class]);
$router->put('/settings/{key}', [SettingsController::class, 'updateSetting'], [AdminAuthMiddleware::class]);
$router->delete('/settings/{key}', [SettingsController::class, 'deleteSetting'], [AdminAuthMiddleware::class]);

// Blocked Domains Routes (Admin only)
$router->get('/blocked-domains', [BlockedDomainsController::class, 'getAll'], [AdminAuthMiddleware::class]);
$router->post('/blocked-domains', [BlockedDomainsController::class, 'add'], [AdminAuthMiddleware::class]);
$router->post('/blocked-domains/bulk-add', [BlockedDomainsController::class, 'bulkAdd'], [AdminAuthMiddleware::class]);
$router->post('/blocked-domains/bulk-remove', [BlockedDomainsController::class, 'bulkRemove'], [AdminAuthMiddleware::class]);
$router->get('/blocked-domains/check', [BlockedDomainsController::class, 'isBlocked']); // Public - for email validation
$router->get('/blocked-domains/export', [BlockedDomainsController::class, 'export'], [AdminAuthMiddleware::class]);
$router->get('/blocked-domains/{id}', [BlockedDomainsController::class, 'get'], [AdminAuthMiddleware::class]);
$router->put('/blocked-domains/{id}', [BlockedDomainsController::class, 'update'], [AdminAuthMiddleware::class]);
$router->delete('/blocked-domains/{id}', [BlockedDomainsController::class, 'remove'], [AdminAuthMiddleware::class]);

// Webhook Routes (public - called by email providers)
$router->post('/webhooks/email-bounce', [WebhookController::class, 'handleBounce']);
$router->post('/webhooks/email-delivery', [WebhookController::class, 'handleDelivery']);
$router->post('/webhooks/email-complaint', [WebhookController::class, 'handleComplaint']);
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

try {
    $router->dispatch($method, $uri);
} catch (Exception $e) {
    error_log('Unhandled API exception: ' . $e->getMessage());
    $message = (($_ENV['APP_ENV'] ?? 'production') === 'development')
        ? $e->getMessage()
        : 'An unexpected server error occurred';
    Response::error($message, 500);
}
