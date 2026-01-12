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
            INSERT INTO payment_transactions (payment_id, user_id, plan, amount, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$paymentId, Auth::id(), $plan, $prices[$plan] / 100]);
        
        Response::json([
            'success' => true,
            'payment_url' => $paymentUrl,
            'payment_id' => $paymentId,
        ]);
    }
    
    /**
     * Handle PayFast webhook/ITN (Instant Transaction Notification)
     */
    public function webhook(): void {
        // Get posted data
        $pfData = $_POST;
        
        // Log incoming ITN
        error_log("PayFast ITN received: " . json_encode($pfData));
        
        // Verify the data
        if (!$this->verifyWebhook($pfData)) {
            error_log("PayFast ITN verification failed");
            Response::error('Invalid signature', 400);
        }
        
        // Extract payment details
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
            SET status = ?, pf_payment_id = ?, updated_at = NOW()
            WHERE payment_id = ?
        ");
        $stmt->execute([$paymentStatus, $pfData['pf_payment_id'] ?? null, $paymentId]);
        
        // If payment is complete, update user plan
        if ($paymentStatus === 'COMPLETE' && in_array($plan, ['solo', 'pro', 'business'])) {
            User::query()->update($userId, ['plan' => $plan]);
            error_log("User $userId upgraded to $plan plan via PayFast");
        }
        
        // PayFast expects a 200 OK response
        Response::success(['message' => 'OK']);
    }
    
    /**
     * Generate PayFast signature
     */
    private function generateSignature(array $data): string {
        // Create parameter string
        $pfOutput = '';
        foreach ($data as $key => $val) {
            if ($val !== '' && $key !== 'signature') {
                $pfOutput .= $key . '=' . urlencode(trim($val)) . '&';
            }
        }
        
        // Remove last ampersand
        $pfOutput = rtrim($pfOutput, '&');
        
        // Add passphrase if set
        if (!empty($this->passphrase)) {
            $pfOutput .= '&passphrase=' . urlencode($this->passphrase);
        }
        
        return md5($pfOutput);
    }
    
    /**
     * Verify PayFast webhook/ITN
     */
    private function verifyWebhook(array $pfData): bool {
        // Verify signature
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
