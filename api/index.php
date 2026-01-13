<?php

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Core includes
require_once __DIR__ . '/core/EmailValidator.php';
require_once __DIR__ . '/core/Recaptcha.php';

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Strip surrounding quotes (single or double)
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            $_ENV[$key] = $value;
        }
    }
}

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

// Health check routes (public)
$router->get('/health', [HealthController::class, 'check']);
$router->get('/health/debug', [HealthController::class, 'debug']);

// Public routes
$router->post('/register', [AuthController::class, 'register']);
$router->post('/login', [AuthController::class, 'login']);
$router->post('/verify-email', [AuthController::class, 'verifyEmail']);
$router->post('/forgot-password', [AuthController::class, 'forgotPassword']);
$router->post('/reset-password', [AuthController::class, 'resetPassword']);

// Admin setup route (temporary - disable after initial setup)
$router->post('/admin/setup', [AuthController::class, 'createAdmin']);

// Admin email check (public - for login page detection)
$router->post('/admin/check-email', [AuthController::class, 'checkAdminEmail']);

// Admin batch login (all 3 passwords at once)
$router->post('/admin/login/batch', [AuthController::class, 'adminLoginBatch']);

// Google OAuth routes
$router->get('/auth/google', [GoogleAuthController::class, 'getAuthUrl']);
$router->post('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// Protected routes
$router->post('/logout', [AuthController::class, 'logout'], [AuthMiddleware::class]);
$router->get('/user', [AuthController::class, 'user'], [AuthMiddleware::class]);
$router->put('/profile', [AuthController::class, 'updateProfile'], [AuthMiddleware::class]);
$router->put('/password', [AuthController::class, 'updatePassword'], [AuthMiddleware::class]);
$router->post('/avatar', [AuthController::class, 'uploadAvatar'], [AuthMiddleware::class]);
$router->delete('/avatar', [AuthController::class, 'deleteAvatar'], [AuthMiddleware::class]);
$router->put('/plan', [AuthController::class, 'updatePlan'], [AuthMiddleware::class]);
$router->post('/resend-verification', [AuthController::class, 'resendVerification'], [AuthMiddleware::class]);
$router->post('/upload-logo', [AuthController::class, 'uploadLogo'], [AuthMiddleware::class]);
$router->delete('/logo', [AuthController::class, 'deleteLogo'], [AuthMiddleware::class]);

// Clients
$router->get('/clients', [ClientController::class, 'index'], [AuthMiddleware::class]);
$router->post('/clients', [ClientController::class, 'store'], [AuthMiddleware::class]);
$router->get('/clients/{id}', [ClientController::class, 'show'], [AuthMiddleware::class]);
$router->put('/clients/{id}', [ClientController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/clients/{id}', [ClientController::class, 'destroy'], [AuthMiddleware::class]);

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

// Payments
$router->get('/payments', [PaymentController::class, 'index'], [AuthMiddleware::class]);
$router->post('/payments', [PaymentController::class, 'store'], [AuthMiddleware::class]);
$router->get('/payments/summary', [PaymentController::class, 'summary'], [AuthMiddleware::class]);
$router->get('/payments/{id}', [PaymentController::class, 'show'], [AuthMiddleware::class]);
$router->delete('/payments/{id}', [PaymentController::class, 'destroy'], [AuthMiddleware::class]);

// Payment History
$router->get('/payment-history', [PaymentHistoryController::class, 'index'], [AuthMiddleware::class]);
$router->get('/payment-history/summary', [PaymentHistoryController::class, 'summary'], [AuthMiddleware::class]);

// Reports
$router->get('/reports/dashboard', [ReportController::class, 'dashboard'], [AuthMiddleware::class]);
$router->get('/reports/monthly-revenue', [ReportController::class, 'monthlyRevenue'], [AuthMiddleware::class]);
$router->get('/reports/invoice-status', [ReportController::class, 'invoiceStatus'], [AuthMiddleware::class]);
$router->get('/reports/top-clients', [ReportController::class, 'topClients'], [AuthMiddleware::class]);
$router->get('/reports/income-expense', [ReportController::class, 'incomeExpense'], [AuthMiddleware::class]);
$router->get('/reports/recent-invoices', [ReportController::class, 'recentInvoices'], [AuthMiddleware::class]);
$router->get('/reports/payment-timeline', [ReportController::class, 'paymentTimeline'], [AuthMiddleware::class]);
$router->get('/reports/billing-history', [ReportController::class, 'billingHistory'], [AuthMiddleware::class]);
$router->get('/reports/extended-stats', [ReportController::class, 'extendedStats'], [AuthMiddleware::class]);
$router->get('/reports/monthly-stats', [ReportController::class, 'monthlyStats'], [AuthMiddleware::class]);

// Templates
$router->get('/templates', [TemplateController::class, 'index'], [AuthMiddleware::class]);
$router->post('/templates', [TemplateController::class, 'store'], [AuthMiddleware::class]);
$router->get('/templates/{id}', [TemplateController::class, 'show'], [AuthMiddleware::class]);
$router->put('/templates/{id}', [TemplateController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/templates/{id}', [TemplateController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/templates/{id}/set-default', [TemplateController::class, 'setDefault'], [AuthMiddleware::class]);

// Notifications
$router->post('/invoices/{id}/send', [NotificationController::class, 'sendEmail'], [AuthMiddleware::class]);
$router->get('/invoices/{id}/email-preview', [NotificationController::class, 'emailPreview'], [AuthMiddleware::class]);
$router->post('/invoices/{id}/send-sms', [NotificationController::class, 'sendSms'], [AuthMiddleware::class]);

// PDF Generation
$router->get('/invoices/{id}/pdf', [PdfController::class, 'generate'], [AuthMiddleware::class]);
$router->get('/invoices/{id}/pdf/download', [PdfController::class, 'download'], [AuthMiddleware::class]);

// GDPR Routes
$router->get('/gdpr/export', [GdprController::class, 'export'], [AuthMiddleware::class]);
$router->delete('/gdpr/delete', [GdprController::class, 'delete'], [AuthMiddleware::class]);

// PayFast Routes
$router->post('/payfast/checkout', [PayfastController::class, 'checkout'], [AuthMiddleware::class]);
$router->post('/payfast/invoice', [PayfastController::class, 'invoicePayment'], [AuthMiddleware::class]);
$router->post('/payfast/webhook', [PayfastController::class, 'webhook']);
$router->post('/payfast/invoice-webhook', [PayfastController::class, 'invoiceWebhook']);
$router->post('/payfast/subscription-webhook', [PayfastController::class, 'subscriptionWebhook']);
$router->post('/payfast/cancel-subscription', [PayfastController::class, 'cancelSubscription'], [AuthMiddleware::class]);

// Paystack Routes
$router->post('/paystack/initialize', [PaystackController::class, 'initialize'], [AuthMiddleware::class]);
$router->get('/paystack/verify/{reference}', [PaystackController::class, 'verify'], [AuthMiddleware::class]);
$router->post('/paystack/webhook', [PaystackController::class, 'webhook']);
$router->get('/paystack/config', [PaystackController::class, 'config']);

// Currency Routes
$router->get('/currencies', [CurrencyController::class, 'index']);
$router->get('/currencies/rates', [CurrencyController::class, 'rates']);
$router->post('/currencies/convert', [CurrencyController::class, 'convert']);
$router->post('/currencies/update-rates', [CurrencyController::class, 'updateRates'], [AuthMiddleware::class]);

// Reminder Routes
$router->get('/reminders', [ReminderController::class, 'index'], [AuthMiddleware::class]);
$router->post('/reminders', [ReminderController::class, 'store'], [AuthMiddleware::class]);
$router->delete('/reminders/{id}', [ReminderController::class, 'destroy'], [AuthMiddleware::class]);
$router->post('/invoices/{id}/reminders', [ReminderController::class, 'scheduleForInvoice'], [AuthMiddleware::class]);
$router->get('/reminders/settings', [ReminderController::class, 'getSettings'], [AuthMiddleware::class]);
$router->put('/reminders/settings', [ReminderController::class, 'updateSettings'], [AuthMiddleware::class]);
$router->post('/reminders/process', [ReminderController::class, 'processPending']); // For cron job

// Recurring Invoice Routes
$router->get('/recurring-invoices', [RecurringInvoiceController::class, 'getAll'], [AuthMiddleware::class]);
$router->get('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'getById'], [AuthMiddleware::class]);
$router->post('/recurring-invoices', [RecurringInvoiceController::class, 'create'], [AuthMiddleware::class]);
$router->put('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'delete'], [AuthMiddleware::class]);
$router->patch('/recurring-invoices/{id}/status', [RecurringInvoiceController::class, 'updateStatus'], [AuthMiddleware::class]);
$router->post('/recurring-invoices/{id}/generate', [RecurringInvoiceController::class, 'generate'], [AuthMiddleware::class]);
$router->post('/recurring-invoices/process', [RecurringInvoiceController::class, 'processDue']); // For cron job

// Credits Routes
$router->get('/credits/usage', [CreditsController::class, 'getUsage'], [AuthMiddleware::class]);
$router->get('/credits/check', [CreditsController::class, 'checkCredits'], [AuthMiddleware::class]);
$router->post('/credits/use', [CreditsController::class, 'useCredits'], [AuthMiddleware::class]);
$router->get('/credits/logs', [CreditsController::class, 'getNotificationLogs'], [AuthMiddleware::class]);
$router->get('/credits/plans', [CreditsController::class, 'getPlans']);
$router->post('/credits/reset', [CreditsController::class, 'resetMonthlyCredits']); // For cron job

// User Notifications Routes
$router->get('/notifications', [UserNotificationController::class, 'index'], [AuthMiddleware::class]);
$router->patch('/notifications/{id}/read', [UserNotificationController::class, 'markAsRead'], [AuthMiddleware::class]);
$router->post('/notifications/mark-all-read', [UserNotificationController::class, 'markAllAsRead'], [AuthMiddleware::class]);
$router->delete('/notifications/{id}', [UserNotificationController::class, 'delete'], [AuthMiddleware::class]);
$router->delete('/notifications', [UserNotificationController::class, 'clearAll'], [AuthMiddleware::class]);

// Contact Form Route (public with rate limiting)
$router->post('/contact', [ContactController::class, 'submit']);

// Admin Routes (3-step authentication)
$router->post('/admin/login/step1', [AdminController::class, 'loginStep1']);
$router->post('/admin/login/step2', [AdminController::class, 'loginStep2']);
$router->post('/admin/login/step3', [AdminController::class, 'loginStep3']);
$router->post('/admin/logout', [AdminController::class, 'logout']);

// Admin Protected Routes
$router->get('/admin/dashboard', [AdminController::class, 'getDashboard']);
$router->get('/admin/submissions', [AdminController::class, 'getSubmissions']);
$router->get('/admin/submissions/{id}', [AdminController::class, 'getSubmission']);
$router->put('/admin/submissions/{id}', [AdminController::class, 'updateSubmission']);
$router->delete('/admin/submissions/{id}', [AdminController::class, 'deleteSubmission']);
$router->post('/admin/submissions/{id}/read', [AdminController::class, 'markAsRead']);
$router->get('/admin/email-logs', [AdminController::class, 'getEmailLogs']);
$router->get('/admin/notification-settings', [AdminController::class, 'getNotificationSettings']);
$router->put('/admin/notification-settings', [AdminController::class, 'updateNotificationSettings']);
$router->get('/admin/export/email-logs', [AdminController::class, 'exportEmailLogs']);
$router->get('/admin/export/submissions', [AdminController::class, 'exportSubmissions']);
$router->get('/admin/reports/statistics', [AdminController::class, 'getStatisticsReport']);

// Admin Activity Logs Routes
$router->get('/admin/activity-logs', [AdminController::class, 'getActivityLogs']);
$router->get('/admin/export/activity-logs', [AdminController::class, 'exportActivityLogs']);

// Admin Session Management Routes
$router->get('/admin/sessions', [AdminController::class, 'getActiveSessions']);
$router->delete('/admin/sessions/{id}', [AdminController::class, 'terminateSession']);
$router->delete('/admin/sessions', [AdminController::class, 'terminateAllSessions']);

// Admin User Management Routes
$router->get('/admin/users', [AuthController::class, 'getAdminUsers']);
$router->put('/admin/users/{id}', [AuthController::class, 'updateAdminUser']);
$router->patch('/admin/users/{id}/toggle', [AuthController::class, 'toggleAdminStatus']);
$router->delete('/admin/users/{id}', [AuthController::class, 'deleteAdminUser']);

// Admin Subscription Metrics Route
$router->get('/admin/subscription-metrics', [AdminController::class, 'getSubscriptionMetrics']);

// QA Console Routes (Admin only)
$router->post('/admin/qa/seed', [QaController::class, 'seed']);
$router->delete('/admin/qa/cleanup', [QaController::class, 'cleanup']);
$router->get('/admin/qa/status', [QaController::class, 'status']);
$router->get('/admin/qa/health', [QaController::class, 'healthCheck']);

// Subscription Routes
$router->get('/subscription', [SubscriptionController::class, 'getSubscription'], [AuthMiddleware::class]);
$router->put('/subscription/renewal-date', [SubscriptionController::class, 'updateRenewalDate'], [AuthMiddleware::class]);

// Subscription Cron Routes (for scheduled tasks)
$router->post('/subscription/process-renewals', [SubscriptionController::class, 'processRenewalReminders']); // Daily cron - sends 3-day reminders
$router->post('/subscription/process-expired', [SubscriptionController::class, 'processExpired']); // Daily cron - handles expired subscriptions

// Billing Portal Routes
$router->get('/billing/portal', [BillingController::class, 'getPortal'], [AuthMiddleware::class]);
$router->get('/billing/transactions', [BillingController::class, 'getTransactions'], [AuthMiddleware::class]);
$router->post('/billing/payment-methods', [BillingController::class, 'addPaymentMethod'], [AuthMiddleware::class]);
$router->post('/billing/payment-methods/{id}/default', [BillingController::class, 'setDefaultPaymentMethod'], [AuthMiddleware::class]);
$router->delete('/billing/payment-methods/{id}', [BillingController::class, 'removePaymentMethod'], [AuthMiddleware::class]);
$router->get('/billing/transactions/{id}/invoice', [BillingController::class, 'downloadInvoice'], [AuthMiddleware::class]);

// Webhook Routes (public - called by email providers)
$router->post('/webhooks/email-bounce', [WebhookController::class, 'handleBounce']);
$router->post('/webhooks/email-delivery', [WebhookController::class, 'handleDelivery']);
$router->post('/webhooks/email-complaint', [WebhookController::class, 'handleComplaint']);
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

try {
    $router->dispatch($method, $uri);
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
