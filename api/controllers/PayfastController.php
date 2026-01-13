<?php

class PayfastController {
    private string $merchantId;
    private string $merchantKey;
    private string $passphrase;
    private bool $sandbox;
    
    public function __construct() {
        $this->merchantId = $_ENV['PAYFAST_MERCHANT_ID'] ?? '';
        $this->merchantKey = $_ENV['PAYFAST_MERCHANT_KEY'] ?? '';
        $this->passphrase = $_ENV['PAYFAST_PASSPHRASE'] ?? '';
        $this->sandbox = ($_ENV['PAYFAST_SANDBOX'] ?? 'true') === 'true';
    }
    
    /**
     * Generate PayFast checkout URL for plan upgrade
     */
    public function checkout(): void {
        $request = new Request();
        $plan = $request->input('plan');
        
        if (!in_array($plan, ['solo', 'pro', 'business'])) {
            Response::error('Invalid plan. Use solo, pro, or business.', 422);
        }
        
        $user = User::query()->find(Auth::id());
        
        // Define plan prices (in ZAR cents for PayFast)
        // Prices: Solo R149, Pro R299, Business R599
        $prices = [
            'solo' => 14900, // R149.00
            'pro' => 29900, // R299.00
            'business' => 59900, // R599.00
        ];
        
        $planNames = [
            'solo' => 'IEOSUIA Solo Plan',
            'pro' => 'IEOSUIA Pro Plan',
            'business' => 'IEOSUIA Business Plan',
        ];
        
        // Generate unique payment ID
        $paymentId = 'PAY-' . Auth::id() . '-' . time() . '-' . bin2hex(random_bytes(4));
        
        // Build PayFast data array
        $data = [
            'merchant_id' => $this->merchantId,
            'merchant_key' => $this->merchantKey,
            'return_url' => $this->getBaseUrl() . '/dashboard/settings?payment=success&plan=' . $plan,
            'cancel_url' => $this->getBaseUrl() . '/dashboard/settings?payment=cancelled',
            'notify_url' => $this->getApiUrl() . '/payfast/webhook',
            'm_payment_id' => $paymentId,
            'amount' => number_format($prices[$plan] / 100, 2, '.', ''),
            'item_name' => $planNames[$plan],
            'item_description' => 'Monthly subscription to ' . $planNames[$plan],
            'email_address' => $user['email'],
            'name_first' => explode(' ', $user['name'])[0] ?? $user['name'],
            'name_last' => explode(' ', $user['name'])[1] ?? '',
            // For recurring payments
            'subscription_type' => '1', // Monthly
            'recurring_amount' => number_format($prices[$plan] / 100, 2, '.', ''),
            'frequency' => '3', // Monthly
            'cycles' => '0', // Indefinite
            'custom_str1' => $plan,
            'custom_int1' => Auth::id(),
        ];
        
        // Generate signature
        $data['signature'] = $this->generateSignature($data);
        
        // Build PayFast URL
        $pfHost = $this->sandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
        $paymentUrl = 'https://' . $pfHost . '/eng/process?' . http_build_query($data);
        
        // Store payment record for verification
        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO payment_transactions (merchant_payment_id, user_id, plan, amount, status, gateway, created_at)
            VALUES (?, ?, ?, ?, 'pending', 'payfast', NOW())
        ");
        $stmt->execute([$paymentId, Auth::id(), $plan, $prices[$plan] / 100]);
        
        Response::json([
            'success' => true,
            'payment_url' => $paymentUrl,
            'payment_id' => $paymentId,
        ]);
    }
    
    /**
     * Initialize PayFast payment for invoice
     * POST /api/payfast/invoice
     */
    public function invoicePayment(): void {
        $request = new Request();
        $invoiceId = $request->input('invoice_id');
        $amount = $request->input('amount');
        
        if (!$invoiceId || !$amount) {
            Response::error('Invoice ID and amount are required', 422);
        }
        
        // Get invoice and verify ownership
        $invoice = Invoice::query()->find((int)$invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        // Get client
        $client = Client::query()->find($invoice['client_id']);
        if (!$client) {
            Response::error('Client not found', 404);
        }
        
        // Generate unique payment ID
        $paymentId = 'INV-' . $invoiceId . '-' . time() . '-' . bin2hex(random_bytes(4));
        
        // Build PayFast data array
        $data = [
            'merchant_id' => $this->merchantId,
            'merchant_key' => $this->merchantKey,
            'return_url' => $this->getBaseUrl() . '/dashboard/payments?payment=success&reference=' . $paymentId,
            'cancel_url' => $this->getBaseUrl() . '/dashboard/invoices?payment=cancelled',
            'notify_url' => $this->getApiUrl() . '/payfast/invoice-webhook',
            'm_payment_id' => $paymentId,
            'amount' => number_format($amount, 2, '.', ''),
            'item_name' => 'Invoice ' . $invoice['invoice_number'],
            'item_description' => 'Payment for invoice ' . $invoice['invoice_number'],
            'email_address' => $client['email'],
            'name_first' => explode(' ', $client['name'])[0] ?? $client['name'],
            'name_last' => explode(' ', $client['name'])[1] ?? '',
            'custom_str1' => 'invoice',
            'custom_str2' => $invoiceId,
            'custom_int1' => Auth::id(),
        ];
        
        // Generate signature
        $data['signature'] = $this->generateSignature($data);
        
        // Build PayFast URL
        $pfHost = $this->sandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
        $paymentUrl = 'https://' . $pfHost . '/eng/process?' . http_build_query($data);
        
        // Store payment record
        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO payment_transactions 
            (merchant_payment_id, user_id, plan, invoice_id, amount, status, gateway, gateway_response, created_at)
            VALUES (?, ?, 'invoice', ?, ?, 'pending', 'payfast', ?, NOW())
        ");
        $stmt->execute([$paymentId, Auth::id(), $invoiceId, $amount, json_encode(['invoice_id' => $invoiceId])]);
        
        Response::json([
            'success' => true,
            'payment_url' => $paymentUrl,
            'payment_id' => $paymentId,
        ]);
    }
    
    /**
     * Handle PayFast webhook/ITN for subscription plans
     */
    public function webhook(): void {
        $pfData = $_POST;
        
        error_log("PayFast ITN received: " . json_encode($pfData));
        
        if (!$this->verifyWebhook($pfData)) {
            error_log("PayFast ITN verification failed");
            Response::error('Invalid signature', 400);
        }
        
        $paymentId = $pfData['m_payment_id'] ?? '';
        $paymentStatus = $pfData['payment_status'] ?? '';
        $plan = $pfData['custom_str1'] ?? '';
        $userId = (int)($pfData['custom_int1'] ?? 0);
        
        if (empty($paymentId) || empty($userId)) {
            Response::error('Missing payment data', 400);
        }
        
        $db = Database::getConnection();
        
        // Update payment transaction status
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = ?, payment_id = ?, updated_at = NOW()
            WHERE merchant_payment_id = ?
        ");
        $status = $paymentStatus === 'COMPLETE' ? 'completed' : strtolower($paymentStatus);
        $stmt->execute([$status, $pfData['pf_payment_id'] ?? null, $paymentId]);
        
        // If payment is complete, update user plan
        if ($paymentStatus === 'COMPLETE' && in_array($plan, ['solo', 'pro', 'business'])) {
            User::query()->update($userId, ['plan' => $plan]);
            error_log("User $userId upgraded to $plan plan via PayFast");
        }
        
        Response::success(['message' => 'OK']);
    }
    
    /**
     * Handle PayFast webhook/ITN for invoice payments
     */
    public function invoiceWebhook(): void {
        $pfData = $_POST;
        
        error_log("PayFast Invoice ITN received: " . json_encode($pfData));
        
        if (!$this->verifyWebhook($pfData)) {
            error_log("PayFast Invoice ITN verification failed");
            Response::error('Invalid signature', 400);
        }
        
        $paymentId = $pfData['m_payment_id'] ?? '';
        $paymentStatus = $pfData['payment_status'] ?? '';
        $invoiceId = (int)($pfData['custom_str2'] ?? 0);
        $userId = (int)($pfData['custom_int1'] ?? 0);
        $amount = (float)($pfData['amount_gross'] ?? 0);
        
        if (empty($paymentId) || empty($invoiceId)) {
            Response::error('Missing payment data', 400);
        }
        
        $db = Database::getConnection();
        
        // Update payment transaction
        $status = $paymentStatus === 'COMPLETE' ? 'completed' : strtolower($paymentStatus);
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = ?, payment_id = ?, gateway_response = ?, updated_at = NOW(), completed_at = NOW()
            WHERE merchant_payment_id = ?
        ");
        $stmt->execute([$status, $pfData['pf_payment_id'] ?? null, json_encode($pfData), $paymentId]);
        
        // If payment is complete, record in payments table
        if ($paymentStatus === 'COMPLETE') {
            $invoice = Invoice::query()->find($invoiceId);
            if ($invoice) {
                // Record payment
                Payment::query()->create([
                    'user_id' => $invoice['user_id'],
                    'invoice_id' => $invoiceId,
                    'amount' => $amount,
                    'method' => 'PayFast',
                    'date' => date('Y-m-d'),
                    'reference' => $paymentId,
                    'notes' => 'PayFast payment - ' . ($pfData['payment_method'] ?? 'online')
                ]);
                
                // Check if invoice is fully paid
                $invoiceModel = new Invoice();
                $invoiceWithRelations = $invoiceModel->withRelations($invoice);
                
                if ($invoiceWithRelations['balance_due'] <= 0) {
                    Invoice::query()->update($invoiceId, ['status' => 'Paid']);
                }
                
                error_log("PayFast invoice payment recorded: $paymentId, amount: $amount, invoice: $invoiceId");
            }
        }
        
        Response::success(['message' => 'OK']);
    }
    
    /**
     * Generate PayFast signature
     */
    private function generateSignature(array $data): string {
        $pfOutput = '';
        foreach ($data as $key => $val) {
            if ($val !== '' && $key !== 'signature') {
                $pfOutput .= $key . '=' . urlencode(trim($val)) . '&';
            }
        }
        
        $pfOutput = rtrim($pfOutput, '&');
        
        if (!empty($this->passphrase)) {
            $pfOutput .= '&passphrase=' . urlencode($this->passphrase);
        }
        
        return md5($pfOutput);
    }
    
    /**
     * Verify PayFast webhook/ITN
     */
    private function verifyWebhook(array $pfData): bool {
        $pfParamString = '';
        foreach ($pfData as $key => $val) {
            if ($key !== 'signature') {
                $pfParamString .= $key . '=' . urlencode($val) . '&';
            }
        }
        $pfParamString = rtrim($pfParamString, '&');
        
        if (!empty($this->passphrase)) {
            $pfParamString .= '&passphrase=' . urlencode($this->passphrase);
        }
        
        $signature = md5($pfParamString);
        
        if ($signature !== ($pfData['signature'] ?? '')) {
            return false;
        }
        
        // Verify source IP (PayFast IPs)
        $validHosts = [
            'www.payfast.co.za',
            'sandbox.payfast.co.za',
            'w1w.payfast.co.za',
            'w2w.payfast.co.za',
        ];
        
        $validIps = [];
        foreach ($validHosts as $pfHostname) {
            $ips = gethostbynamel($pfHostname);
            if ($ips !== false) {
                $validIps = array_merge($validIps, $ips);
            }
        }
        
        $validIps = array_unique($validIps);
        $remoteIp = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // In sandbox mode, skip IP verification
        if (!$this->sandbox && !in_array($remoteIp, $validIps)) {
            error_log("PayFast ITN from invalid IP: $remoteIp");
            return false;
        }
        
        return true;
    }
    
    /**
     * Get frontend base URL
     */
    private function getBaseUrl(): string {
        return $_ENV['FRONTEND_URL'] ?? 'https://invoices.ieosuia.com';
    }
    
    /**
     * Get API base URL
     */
    private function getApiUrl(): string {
        return $_ENV['API_URL'] ?? 'https://invoices.ieosuia.com/api';
    }
}
