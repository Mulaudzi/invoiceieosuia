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
        
        error_log("Payment recorded successfully: $reference, amount: $amount, invoice: $invoiceId");
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
     * Get frontend base URL
     */
    private function getBaseUrl(): string {
        return $_ENV['FRONTEND_URL'] ?? 'https://invoices.ieosuia.com';
    }
}
