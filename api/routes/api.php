<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/plan', [AuthController::class, 'updatePlan']);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Products
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::apiResource('products', ProductController::class);

    // Templates
    Route::post('/templates/{template}/default', [TemplateController::class, 'setDefault']);
    Route::apiResource('templates', TemplateController::class);

    // Invoices
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);
    Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send']);
    Route::post('/invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid']);
    Route::apiResource('invoices', InvoiceController::class);

    // Payments
    Route::get('/payments/summary', [PaymentController::class, 'summary']);
    Route::apiResource('payments', PaymentController::class)->except(['update']);

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [ReportController::class, 'dashboard']);
        Route::get('/monthly-revenue', [ReportController::class, 'monthlyRevenue']);
        Route::get('/invoice-status', [ReportController::class, 'invoiceStatus']);
        Route::get('/top-clients', [ReportController::class, 'topClients']);
        Route::get('/income-expense', [ReportController::class, 'incomeExpense']);
        Route::get('/recent-invoices', [ReportController::class, 'recentInvoices']);
    });
});
