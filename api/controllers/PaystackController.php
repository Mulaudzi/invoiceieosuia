<?php

/**
 * Paystack Payment Controller
 * Handles Paystack payment integration for invoice payments
 */
class PaystackController {
    private string $secretKey;
    private string $publicKey;
    
    public function __construct() {
        $this->secretKey = $_ENV['PAYSTACK_SECRET_KEY'] ?? '';
        $this->publicKey = $_ENV['PAYSTACK_PUBLIC_KEY'] ?? '';
    }
    
    /**
     * Initialize a payment for an invoice
     * POST /api/paystack/initialize
     */
    public function initialize(): void {
        $request = new Request();
        $invoiceId = $request->input('invoice_id');
        $amount = $request->input('amount');
        $callbackUrl = $request->input('callback_url');
        
        if (!$invoiceId || !$amount) {
            Response::error('Invoice ID and amount are required', 422);
        }
        
        // Get invoice and verify ownership
        $invoice = Invoice::query()->find((int)$invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        // Get client email
        $client = Client::query()->find($invoice['client_id']);
        if (!$client) {
            Response::error('Client not found', 404);
        }
        
        // Generate unique reference
        $reference = 'INV-' . $invoiceId . '-' . time() . '-' . bin2hex(random_bytes(4));
        
        // Initialize payment with Paystack
        $url = "https://api.paystack.co/transaction/initialize";
        
        $fields = [
            'email' => $client['email'],
            'amount' => (int)($amount * 100), // Paystack uses kobo (cents)
            'reference' => $reference,
            'callback_url' => $callbackUrl ?? $this->getBaseUrl() . '/dashboard/payments?status=success&reference=' . $reference,
            'metadata' => [
                'invoice_id' => $invoiceId,
                'user_id' => Auth::id(),
                'invoice_number' => $invoice['invoice_number'],
                'custom_fields' => [
                    [
                        'display_name' => 'Invoice Number',
                        'variable_name' => 'invoice_number',
                        'value' => $invoice['invoice_number']
                    ]
                ]
            ]
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->secretKey,
            "Cache-Control: no-cache",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $response = json_decode($result, true);
        
        if ($httpCode !== 200 || !$response['status']) {
            error_log("Paystack initialization failed: " . $result);
            Response::error($response['message'] ?? 'Failed to initialize payment', 400);
        }
        
        // Store pending transaction
        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO payment_transactions 
            (user_id, plan, amount, merchant_payment_id, status, gateway, gateway_response, created_at)
            VALUES (?, 'invoice', ?, ?, 'pending', 'paystack', ?, NOW())
        ");
        $stmt->execute([Auth::id(), $amount, $reference, json_encode(['invoice_id' => $invoiceId])]);
        
        Response::json([
            'success' => true,
            'authorization_url' => $response['data']['authorization_url'],
            'access_code' => $response['data']['access_code'],
            'reference' => $reference
        ]);
    }
    
    /**
     * Verify a payment
     * GET /api/paystack/verify/{reference}
     */
    public function verify(array $params): void {
        $reference = $params['reference'] ?? '';
        
        if (empty($reference)) {
            Response::error('Reference is required', 422);
        }
        
        $url = "https://api.paystack.co/transaction/verify/" . rawurlencode($reference);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->secretKey,
            "Cache-Control: no-cache"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $response = json_decode($result, true);
        
        if ($httpCode !== 200 || !$response['status']) {
            Response::error($response['message'] ?? 'Failed to verify payment', 400);
        }
        
        $data = $response['data'];
        
        // Process successful payment
        if ($data['status'] === 'success') {
            $this->recordPayment($reference, $data);
        }
        
        Response::json([
            'success' => true,
            'status' => $data['status'],
            'amount' => $data['amount'] / 100,
            'reference' => $reference
        ]);
    }
    
    /**
     * Handle Paystack webhook
     * POST /api/paystack/webhook
     */
    public function webhook(): void {
        // Verify webhook signature
        $input = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
        
        if (!$this->verifyWebhookSignature($input, $signature)) {
            error_log("Paystack webhook signature verification failed");
            Response::error('Invalid signature', 400);
        }
        
        $event = json_decode($input, true);
        error_log("Paystack webhook received: " . $input);
        
        $eventType = $event['event'] ?? '';
        
        switch ($eventType) {
            case 'charge.success':
                $this->handleChargeSuccess($event['data']);
                break;
            case 'charge.failed':
                $this->handleChargeFailed($event['data']);
                break;
            case 'subscription.create':
                $this->handleSubscriptionCreate($event['data']);
                break;
            case 'subscription.not_renew':
            case 'subscription.disable':
                $this->handleSubscriptionCancel($event['data']);
                break;
            case 'invoice.create':
            case 'invoice.update':
                $this->handleSubscriptionInvoice($event['data']);
                break;
            case 'transfer.success':
                // Handle transfer success if needed
                break;
            case 'transfer.failed':
                // Handle transfer failure if needed
                break;
            default:
                error_log("Unhandled Paystack event: $eventType");
        }
        
        Response::success(['message' => 'Webhook processed']);
    }
    
    /**
     * Handle successful charge
     */
    private function handleChargeSuccess(array $data): void {
        $reference = $data['reference'] ?? '';
        
        if (empty($reference)) {
            error_log("Paystack charge.success missing reference");
            return;
        }
        
        $this->recordPayment($reference, $data);
    }
    
    /**
     * Record payment in the payments table
     */
    private function recordPayment(string $reference, array $data): void {
        $db = Database::getConnection();
        
        // Check if already processed
        $stmt = $db->prepare("SELECT status FROM payment_transactions WHERE merchant_payment_id = ?");
        $stmt->execute([$reference]);
        $transaction = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($transaction && $transaction['status'] === 'completed') {
            error_log("Payment already processed: $reference");
            return;
        }
        
        // Get invoice ID from metadata
        $invoiceId = $data['metadata']['invoice_id'] ?? null;
        
        if (!$invoiceId) {
            // Try to get from stored transaction
            $stmt = $db->prepare("SELECT gateway_response FROM payment_transactions WHERE merchant_payment_id = ?");
            $stmt->execute([$reference]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($row) {
                $stored = json_decode($row['gateway_response'], true);
                $invoiceId = $stored['invoice_id'] ?? null;
            }
        }
        
        if (!$invoiceId) {
            error_log("No invoice ID found for payment: $reference");
            return;
        }
        
        // Get invoice to get user_id
        $invoice = Invoice::query()->find((int)$invoiceId);
        if (!$invoice) {
            error_log("Invoice not found for payment: $reference, invoice_id: $invoiceId");
            return;
        }
        
        // Get client for email notification
        $client = Client::query()->find($invoice['client_id']);
        
        $amount = ($data['amount'] ?? 0) / 100; // Convert from kobo
        
        // Record in payments table
        $paymentId = Payment::query()->create([
            'user_id' => $invoice['user_id'],
            'invoice_id' => $invoiceId,
            'amount' => $amount,
            'method' => 'Paystack',
            'date' => date('Y-m-d'),
            'reference' => $reference,
            'notes' => 'Paystack payment - ' . ($data['channel'] ?? 'card')
        ]);
        
        // Update transaction status
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = 'completed', payment_id = ?, completed_at = NOW(), gateway_response = ?
            WHERE merchant_payment_id = ?
        ");
        $stmt->execute([$data['id'] ?? null, json_encode($data), $reference]);
        
        // Check if invoice is fully paid
        $invoiceModel = new Invoice();
        $invoiceWithRelations = $invoiceModel->withRelations($invoice);
        
        if ($invoiceWithRelations['balance_due'] <= 0) {
            Invoice::query()->update($invoiceId, ['status' => 'Paid']);
        }
        
        // Send payment success email to client
        if ($client && !empty($client['email'])) {
            Mailer::sendPaymentSuccessEmail($client['email'], [
                'name' => $client['name'],
                'amount' => $amount,
                'currency' => $invoice['currency'] ?? 'R',
                'invoice_number' => $invoice['invoice_number'],
                'reference' => $reference,
                'payment_method' => 'Paystack (' . ($data['channel'] ?? 'card') . ')',
                'date' => date('Y-m-d H:i'),
            ]);
        }
        
        // Also notify the invoice owner (user)
        $user = User::query()->find($invoice['user_id']);
        if ($user && !empty($user['email'])) {
            Mailer::sendPaymentSuccessEmail($user['email'], [
                'name' => $user['name'],
                'amount' => $amount,
                'currency' => $invoice['currency'] ?? 'R',
                'invoice_number' => $invoice['invoice_number'],
                'reference' => $reference,
                'payment_method' => 'Paystack (' . ($data['channel'] ?? 'card') . ')',
                'date' => date('Y-m-d H:i'),
            ]);
        }
        
        error_log("Payment recorded successfully: $reference, amount: $amount, invoice: $invoiceId");
    }
    
    /**
     * Handle failed payment notification
     */
    private function handleChargeFailed(array $data): void {
        $reference = $data['reference'] ?? '';
        $invoiceId = $data['metadata']['invoice_id'] ?? null;
        $isSubscription = $data['metadata']['is_subscription'] ?? false;
        $userId = $data['metadata']['user_id'] ?? null;
        
        $db = Database::getConnection();
        
        // Get or find the transaction
        $stmt = $db->prepare("SELECT id, user_id FROM payment_transactions WHERE merchant_payment_id = ?");
        $stmt->execute([$reference]);
        $transaction = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        // Update transaction status with failure details
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = 'failed', 
                gateway_response = ?, 
                failure_reason = ?,
                updated_at = NOW()
            WHERE merchant_payment_id = ?
        ");
        $failureReason = $data['gateway_response'] ?? $data['message'] ?? 'Payment declined by gateway';
        $stmt->execute([json_encode($data), $failureReason, $reference]);
        
        // Trigger payment retry system for subscription payments
        if ($transaction) {
            $this->initializeRetry($transaction['id'], $transaction['user_id'], $failureReason);
        }
        
        // Send immediate failure notification for invoice payments
        if ($invoiceId) {
            $invoice = Invoice::query()->find((int)$invoiceId);
            if ($invoice) {
                $client = Client::query()->find($invoice['client_id']);
                $amount = ($data['amount'] ?? 0) / 100;
                
                if ($client && !empty($client['email'])) {
                    Mailer::sendPaymentFailedEmail($client['email'], [
                        'name' => $client['name'],
                        'amount' => $amount,
                        'currency' => $invoice['currency'] ?? 'R',
                        'invoice_number' => $invoice['invoice_number'],
                        'reference' => $reference,
                        'error_message' => $failureReason,
                        'date' => date('Y-m-d H:i'),
                    ]);
                }
            }
        }
        
        error_log("Payment failed: $reference" . ($invoiceId ? ", invoice: $invoiceId" : ""));
    }
    
    /**
     * Initialize retry system for failed payment
     */
    private function initializeRetry(int $transactionId, int $userId, string $failureReason): void {
        $db = Database::getConnection();
        
        // Load retry settings
        $stmt = $db->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'payment'");
        $stmt->execute();
        $settings = $stmt->fetchAll(\PDO::FETCH_KEY_PAIR);
        
        $retryIntervals = !empty($settings['payment_retry_intervals']) 
            ? array_map('intval', explode(',', $settings['payment_retry_intervals']))
            : [1, 3, 7];
        $maxRetries = (int)($settings['payment_max_retries'] ?? 3);
        
        // Calculate first retry date
        $nextRetryAt = (new DateTime())->modify("+{$retryIntervals[0]} days")->format('Y-m-d H:i:s');
        
        // Update transaction with retry schedule
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET max_retries = ?,
                next_retry_at = ?,
                failure_reason = ?
            WHERE id = ?
        ");
        $stmt->execute([$maxRetries, $nextRetryAt, $failureReason, $transactionId]);
        
        // Update user failure tracking
        $db->prepare("
            UPDATE users 
            SET payment_failure_count = payment_failure_count + 1,
                last_payment_failure_at = NOW()
            WHERE id = ?
        ")->execute([$userId]);
        
        // Get user for notification
        $user = User::query()->find($userId);
        if ($user && !empty($user['email'])) {
            // Send first failure notification via retry controller
            $retryController = new PaymentRetryController();
            // Note: We're letting the retry controller handle the email through its template system
        }
        
        error_log("Payment retry initialized for transaction $transactionId, next retry: $nextRetryAt");
    }
    
    /**
     * Verify webhook signature
     */
    private function verifyWebhookSignature(string $input, string $signature): bool {
        if (empty($this->secretKey)) {
            return false;
        }
        
        return hash_equals(
            hash_hmac('sha512', $input, $this->secretKey),
            $signature
        );
    }
    
    /**
     * Get public key for frontend
     * GET /api/paystack/config
     */
    public function config(): void {
        Response::json([
            'public_key' => $this->publicKey
        ]);
    }
    
    /**
     * Handle subscription creation
     */
    private function handleSubscriptionCreate(array $data): void {
        $customerEmail = $data['customer']['email'] ?? '';
        $planCode = $data['plan']['plan_code'] ?? '';
        $subscriptionCode = $data['subscription_code'] ?? '';
        
        if (empty($customerEmail)) {
            return;
        }
        
        $db = Database::getConnection();
        
        // Find user by email
        $stmt = $db->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$customerEmail]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            error_log("Paystack subscription.create: User not found for email $customerEmail");
            return;
        }
        
        // Determine plan from plan code
        $plan = $this->getPlanFromCode($planCode);
        
        // Update user plan and set renewal date (1 month from now)
        $renewalDate = (new DateTime())->modify('+1 month')->format('Y-m-d');
        
        $stmt = $db->prepare("
            UPDATE users 
            SET plan = ?, subscription_renewal_date = ?
            WHERE id = ?
        ");
        $stmt->execute([$plan, $renewalDate, $user['id']]);
        
        // Record in subscription history
        $stmt = $db->prepare("
            INSERT INTO subscription_history (user_id, plan, payment_reference, status, started_at)
            VALUES (?, ?, ?, 'active', NOW())
        ");
        $stmt->execute([$user['id'], $plan, $subscriptionCode]);
        
        // Send confirmation email
        Mailer::sendSubscriptionSuccessEmail($customerEmail, [
            'name' => $user['name'],
            'plan' => $plan,
        ]);
        
        error_log("Paystack subscription created: user {$user['id']}, plan $plan");
    }
    
    /**
     * Handle subscription cancellation
     */
    private function handleSubscriptionCancel(array $data): void {
        $customerEmail = $data['customer']['email'] ?? '';
        $subscriptionCode = $data['subscription_code'] ?? '';
        
        if (empty($customerEmail)) {
            return;
        }
        
        $db = Database::getConnection();
        
        // Find user by email
        $stmt = $db->prepare("SELECT id, name, plan FROM users WHERE email = ?");
        $stmt->execute([$customerEmail]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return;
        }
        
        // Update subscription history
        $stmt = $db->prepare("
            UPDATE subscription_history 
            SET status = 'cancelled', ended_at = NOW()
            WHERE user_id = ? AND status = 'active'
        ");
        $stmt->execute([$user['id']]);
        
        // Note: Don't immediately downgrade - let them use until end of billing period
        // The processExpired cron job will handle downgrade after renewal date passes
        
        error_log("Paystack subscription cancelled: user {$user['id']}");
    }
    
    /**
     * Handle subscription invoice (for recurring billing)
     */
    private function handleSubscriptionInvoice(array $data): void {
        $customerEmail = $data['customer']['email'] ?? '';
        $amount = ($data['amount'] ?? 0) / 100;
        $status = $data['status'] ?? '';
        
        if ($status === 'success' || $status === 'paid') {
            $db = Database::getConnection();
            
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$customerEmail]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                // Extend renewal date by 1 month
                $stmt = $db->prepare("
                    UPDATE users 
                    SET subscription_renewal_date = DATE_ADD(COALESCE(subscription_renewal_date, CURDATE()), INTERVAL 1 MONTH)
                    WHERE id = ?
                ");
                $stmt->execute([$user['id']]);
                
                error_log("Paystack subscription renewed: user {$user['id']}, amount R$amount");
            }
        }
    }
    
    /**
     * Map Paystack plan code to internal plan name
     */
    private function getPlanFromCode(string $planCode): string {
        // Map your Paystack plan codes to internal plan names
        $planMap = [
            'PLN_solo' => 'solo',
            'PLN_pro' => 'pro',
            'PLN_business' => 'business',
            'PLN_enterprise' => 'enterprise',
        ];
        
        foreach ($planMap as $code => $plan) {
            if (stripos($planCode, $code) !== false) {
                return $plan;
            }
        }
        
        // Try to infer from plan code name
        $planCode = strtolower($planCode);
        if (strpos($planCode, 'solo') !== false) return 'solo';
        if (strpos($planCode, 'pro') !== false) return 'pro';
        if (strpos($planCode, 'business') !== false) return 'business';
        if (strpos($planCode, 'enterprise') !== false) return 'enterprise';
        
        return 'solo'; // Default
    }
    
    /**
     * Get frontend base URL
     */
    private function getBaseUrl(): string {
        return $_ENV['FRONTEND_URL'] ?? 'https://invoices.ieosuia.com';
    }
}
