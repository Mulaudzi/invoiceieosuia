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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
            $_ENV[trim($key)] = trim($value);
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

// Public routes
$router->post('/register', [AuthController::class, 'register']);
$router->post('/login', [AuthController::class, 'login']);
$router->post('/verify-email', [AuthController::class, 'verifyEmail']);
$router->post('/forgot-password', [AuthController::class, 'forgotPassword']);
$router->post('/reset-password', [AuthController::class, 'resetPassword']);

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

// Reports
$router->get('/reports/dashboard', [ReportController::class, 'dashboard'], [AuthMiddleware::class]);
$router->get('/reports/monthly-revenue', [ReportController::class, 'monthlyRevenue'], [AuthMiddleware::class]);
$router->get('/reports/invoice-status', [ReportController::class, 'invoiceStatus'], [AuthMiddleware::class]);
$router->get('/reports/top-clients', [ReportController::class, 'topClients'], [AuthMiddleware::class]);
$router->get('/reports/income-expense', [ReportController::class, 'incomeExpense'], [AuthMiddleware::class]);
$router->get('/reports/recent-invoices', [ReportController::class, 'recentInvoices'], [AuthMiddleware::class]);

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
$router->post('/payfast/webhook', [PayfastController::class, 'webhook']);

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

// Dispatch request
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

try {
    $router->dispatch($method, $uri);
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
