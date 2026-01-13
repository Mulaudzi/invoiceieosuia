<?php

/**
 * Payment Retry Controller
 * Handles automatic retry of failed payments with notifications and grace periods
 */
class PaymentRetryController {
    
    // Default retry intervals in days
    private array $retryIntervals = [1, 3, 7];
    private int $gracePeriodDays = 7;
    private int $maxRetries = 3;
    
    public function __construct() {
        // Load settings from database if available
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'payment'");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        if (!empty($settings['payment_retry_intervals'])) {
            $this->retryIntervals = array_map('intval', explode(',', $settings['payment_retry_intervals']));
        }
        if (!empty($settings['payment_grace_period_days'])) {
            $this->gracePeriodDays = (int)$settings['payment_grace_period_days'];
        }
        if (!empty($settings['payment_max_retries'])) {
            $this->maxRetries = (int)$settings['payment_max_retries'];
        }
    }
    
    /**
     * Process failed payments and schedule retries
     * Called by cron job
     * POST /api/payments/process-retries
     */
    public function processRetries(): void {
        $db = Database::getConnection();
        
        // Find failed transactions that need retry
        $stmt = $db->prepare("
            SELECT pt.*, u.email, u.name, u.plan
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.status = 'failed'
            AND pt.retry_count < pt.max_retries
            AND (pt.next_retry_at IS NULL OR pt.next_retry_at <= NOW())
            ORDER BY pt.created_at ASC
            LIMIT 50
        ");
        $stmt->execute();
        $failedTransactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $processed = 0;
        $retried = 0;
        $errors = [];
        
        foreach ($failedTransactions as $transaction) {
            try {
                $result = $this->attemptRetry($transaction);
                $processed++;
                if ($result['success']) {
                    $retried++;
                }
            } catch (Exception $e) {
                $errors[] = [
                    'transaction_id' => $transaction['id'],
                    'error' => $e->getMessage()
                ];
            }
        }
        
        Response::json([
            'success' => true,
            'message' => 'Processed payment retries',
            'processed' => $processed,
            'retried_successfully' => $retried,
            'errors' => $errors
        ]);
    }
    
    /**
     * Attempt to retry a failed payment
     */
    private function attemptRetry(array $transaction): array {
        $db = Database::getConnection();
        $gateway = $transaction['gateway'] ?? 'paystack';
        
        // Increment retry count
        $retryCount = ($transaction['retry_count'] ?? 0) + 1;
        
        // Attempt the retry based on gateway
        $retryResult = match($gateway) {
            'paystack' => $this->retryPaystack($transaction),
            'payfast' => $this->retryPayfast($transaction),
            default => ['success' => false, 'error' => 'Unknown gateway']
        };
        
        if ($retryResult['success']) {
            // Payment succeeded on retry
            $stmt = $db->prepare("
                UPDATE payment_transactions 
                SET status = 'completed', 
                    retry_count = ?,
                    last_retry_at = NOW(),
                    completed_at = NOW(),
                    gateway_response = ?
                WHERE id = ?
            ");
            $stmt->execute([$retryCount, json_encode($retryResult), $transaction['id']]);
            
            // Reset user's failure count
            $db->prepare("
                UPDATE users 
                SET payment_failure_count = 0, 
                    last_payment_failure_at = NULL,
                    subscription_grace_until = NULL
                WHERE id = ?
            ")->execute([$transaction['user_id']]);
            
            // Send success notification
            $this->sendRetrySuccessEmail($transaction);
            
            return ['success' => true, 'message' => 'Payment retry successful'];
        } else {
            // Retry failed
            $nextRetryInterval = $this->retryIntervals[$retryCount - 1] ?? end($this->retryIntervals);
            $nextRetryAt = (new DateTime())->modify("+{$nextRetryInterval} days")->format('Y-m-d H:i:s');
            
            if ($retryCount >= $this->maxRetries) {
                // Max retries reached - enter grace period
                $this->handleMaxRetriesReached($transaction);
                $nextRetryAt = null;
            } else {
                // Schedule next retry
                $stmt = $db->prepare("
                    UPDATE payment_transactions 
                    SET retry_count = ?,
                        last_retry_at = NOW(),
                        next_retry_at = ?,
                        failure_reason = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $retryCount,
                    $nextRetryAt,
                    $retryResult['error'] ?? 'Payment failed',
                    $transaction['id']
                ]);
                
                // Send retry scheduled notification
                $this->sendRetryScheduledEmail($transaction, $retryCount, $nextRetryAt);
            }
            
            return ['success' => false, 'retry_scheduled' => $nextRetryAt];
        }
    }
    
    /**
     * Handle when max retries have been reached
     */
    private function handleMaxRetriesReached(array $transaction): void {
        $db = Database::getConnection();
        
        // Calculate grace period end date
        $graceUntil = (new DateTime())->modify("+{$this->gracePeriodDays} days")->format('Y-m-d');
        
        // Update transaction to final failed state
        $db->prepare("
            UPDATE payment_transactions 
            SET status = 'failed',
                retry_count = max_retries,
                next_retry_at = NULL,
                failure_reason = 'Max retries exceeded - grace period started'
            WHERE id = ?
        ")->execute([$transaction['id']]);
        
        // Set user grace period
        $db->prepare("
            UPDATE users 
            SET subscription_grace_until = ?,
                payment_failure_count = payment_failure_count + 1,
                last_payment_failure_at = NOW()
            WHERE id = ?
        ")->execute([$graceUntil, $transaction['user_id']]);
        
        // Log notification
        $this->logNotification($transaction['user_id'], $transaction['id'], 'final_failure');
        
        // Send final failure email with grace period info
        $this->sendFinalFailureEmail($transaction, $graceUntil);
    }
    
    /**
     * Process grace period expirations
     * Called by cron job
     * POST /api/payments/process-grace-periods
     */
    public function processGracePeriods(): void {
        $db = Database::getConnection();
        
        // Send warnings 2 days before grace period ends
        $warningDate = (new DateTime())->modify('+2 days')->format('Y-m-d');
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.name, u.plan, u.subscription_grace_until
            FROM users u
            LEFT JOIN payment_retry_notifications prn ON u.id = prn.user_id 
                AND prn.notification_type = 'grace_warning'
                AND DATE(prn.sent_at) = CURDATE()
            WHERE u.subscription_grace_until = ?
            AND prn.id IS NULL
        ");
        $stmt->execute([$warningDate]);
        $warningUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($warningUsers as $user) {
            $this->sendGraceWarningEmail($user);
            $this->logNotification($user['id'], null, 'grace_warning');
        }
        
        // Process expired grace periods
        $stmt = $db->prepare("
            SELECT id, email, name, plan, subscription_grace_until
            FROM users 
            WHERE subscription_grace_until IS NOT NULL
            AND subscription_grace_until < CURDATE()
            AND plan IN ('solo', 'pro', 'business', 'enterprise')
        ");
        $stmt->execute();
        $expiredUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $processed = 0;
        $errors = [];
        
        foreach ($expiredUsers as $user) {
            try {
                // Close current subscription in history
                $db->prepare("
                    UPDATE subscription_history 
                    SET ended_at = NOW(), status = 'payment_failed'
                    WHERE user_id = ? AND status = 'active'
                ")->execute([$user['id']]);
                
                // Downgrade to free plan
                $db->prepare("
                    UPDATE users 
                    SET plan = 'free', 
                        subscription_renewal_date = NULL,
                        subscription_grace_until = NULL,
                        email_credits = 10,
                        sms_credits = 5
                    WHERE id = ?
                ")->execute([$user['id']]);
                
                // Log new subscription record
                $db->prepare("
                    INSERT INTO subscription_history (user_id, plan, started_at, status)
                    VALUES (?, 'free', NOW(), 'active')
                ")->execute([$user['id']]);
                
                // Send grace period ended email
                $this->sendGraceEndedEmail($user);
                $this->logNotification($user['id'], null, 'grace_ending');
                
                $processed++;
            } catch (Exception $e) {
                $errors[] = ['user_id' => $user['id'], 'error' => $e->getMessage()];
            }
        }
        
        Response::json([
            'success' => true,
            'warnings_sent' => count($warningUsers),
            'grace_periods_processed' => $processed,
            'errors' => $errors
        ]);
    }
    
    /**
     * Record a failed payment and schedule first retry
     * Called when payment initially fails
     */
    public function recordFailure(): void {
        $request = new Request();
        $transactionId = $request->input('transaction_id');
        $failureReason = $request->input('failure_reason');
        
        if (!$transactionId) {
            Response::error('Transaction ID required', 422);
        }
        
        $db = Database::getConnection();
        
        // Get transaction
        $stmt = $db->prepare("SELECT * FROM payment_transactions WHERE id = ?");
        $stmt->execute([$transactionId]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transaction) {
            Response::error('Transaction not found', 404);
        }
        
        // Calculate first retry date
        $firstRetryDays = $this->retryIntervals[0] ?? 1;
        $nextRetryAt = (new DateTime())->modify("+{$firstRetryDays} days")->format('Y-m-d H:i:s');
        
        // Update transaction
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = 'failed',
                failure_reason = ?,
                next_retry_at = ?,
                max_retries = ?
            WHERE id = ?
        ");
        $stmt->execute([$failureReason, $nextRetryAt, $this->maxRetries, $transactionId]);
        
        // Update user failure count
        $db->prepare("
            UPDATE users 
            SET payment_failure_count = payment_failure_count + 1,
                last_payment_failure_at = NOW()
            WHERE id = ?
        ")->execute([$transaction['user_id']]);
        
        // Get user and send first failure notification
        $user = User::query()->find($transaction['user_id']);
        if ($user) {
            $this->sendFirstFailureEmail(array_merge($transaction, ['email' => $user['email'], 'name' => $user['name']]));
            $this->logNotification($transaction['user_id'], $transactionId, 'first_failure');
        }
        
        Response::json([
            'success' => true,
            'next_retry_at' => $nextRetryAt,
            'message' => 'Payment failure recorded, retry scheduled'
        ]);
    }
    
    /**
     * Get retry status for a transaction
     */
    public function getRetryStatus(): void {
        $request = new Request();
        $transactionId = $request->input('transaction_id');
        
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT pt.*, u.subscription_grace_until
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.id = ? AND pt.user_id = ?
        ");
        $stmt->execute([$transactionId, Auth::id()]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transaction) {
            Response::error('Transaction not found', 404);
        }
        
        Response::json([
            'transaction_id' => $transaction['id'],
            'status' => $transaction['status'],
            'retry_count' => $transaction['retry_count'],
            'max_retries' => $transaction['max_retries'],
            'next_retry_at' => $transaction['next_retry_at'],
            'last_retry_at' => $transaction['last_retry_at'],
            'failure_reason' => $transaction['failure_reason'],
            'grace_until' => $transaction['subscription_grace_until']
        ]);
    }
    
    /**
     * Manually trigger a retry for a transaction
     */
    public function manualRetry(): void {
        $request = new Request();
        $transactionId = $request->input('transaction_id');
        
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT pt.*, u.email, u.name, u.plan
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.id = ? AND pt.user_id = ?
        ");
        $stmt->execute([$transactionId, Auth::id()]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transaction) {
            Response::error('Transaction not found', 404);
        }
        
        if ($transaction['status'] !== 'failed') {
            Response::error('Only failed transactions can be retried', 422);
        }
        
        $result = $this->attemptRetry($transaction);
        
        Response::json([
            'success' => $result['success'],
            'message' => $result['message'] ?? 'Retry processed',
            'next_retry' => $result['retry_scheduled'] ?? null
        ]);
    }
    
    // Gateway-specific retry methods
    private function retryPaystack(array $transaction): array {
        // For Paystack, we need to use their recurring charge API if available
        // or redirect user to retry manually
        // This is a simplified implementation
        
        $secretKey = $_ENV['PAYSTACK_SECRET_KEY'] ?? '';
        if (empty($secretKey)) {
            return ['success' => false, 'error' => 'Paystack not configured'];
        }
        
        // Check if we have authorization for recurring charge
        $authorizationCode = $this->getPaystackAuthorization($transaction['user_id']);
        
        if (!$authorizationCode) {
            return ['success' => false, 'error' => 'No saved payment method - manual retry required'];
        }
        
        // Attempt recurring charge
        $url = "https://api.paystack.co/transaction/charge_authorization";
        
        $fields = [
            'authorization_code' => $authorizationCode,
            'email' => $transaction['email'],
            'amount' => (int)($transaction['amount'] * 100),
            'reference' => $transaction['merchant_payment_id'] . '-retry-' . time()
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $secretKey,
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $response = json_decode($result, true);
        
        if ($httpCode === 200 && ($response['data']['status'] ?? '') === 'success') {
            return ['success' => true, 'gateway_response' => $response];
        }
        
        return [
            'success' => false, 
            'error' => $response['message'] ?? 'Paystack retry failed'
        ];
    }
    
    private function retryPayfast(array $transaction): array {
        // PayFast doesn't support automatic retries easily
        // User needs to manually retry or we send them a payment link
        return ['success' => false, 'error' => 'Manual retry required for PayFast'];
    }
    
    private function getPaystackAuthorization(int $userId): ?string {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT authorization_code 
            FROM payment_methods 
            WHERE user_id = ? AND is_default = 1 AND status = 'active' AND gateway = 'paystack'
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['authorization_code'] ?? null;
    }
    
    // Email notification methods
    private function sendFirstFailureEmail(array $transaction): void {
        $retryDate = (new DateTime())->modify("+{$this->retryIntervals[0]} days")->format('F j, Y');
        $updatePaymentUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/dashboard/billing';
        
        $subject = "Payment Failed - Action Required";
        $body = $this->getEmailTemplate('first_failure', [
            'name' => $transaction['name'],
            'amount' => number_format($transaction['amount'], 2),
            'plan' => ucfirst($transaction['plan'] ?? 'subscription'),
            'retry_date' => $retryDate,
            'update_payment_url' => $updatePaymentUrl,
            'failure_reason' => $transaction['failure_reason'] ?? 'The payment could not be processed.'
        ]);
        
        Mailer::send($transaction['email'], $subject, $body);
    }
    
    private function sendRetryScheduledEmail(array $transaction, int $retryCount, string $nextRetryAt): void {
        $retryDate = (new DateTime($nextRetryAt))->format('F j, Y');
        $updatePaymentUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/dashboard/billing';
        
        $subject = "Payment Retry Scheduled - Attempt {$retryCount} of {$this->maxRetries}";
        $body = $this->getEmailTemplate('retry_scheduled', [
            'name' => $transaction['name'],
            'amount' => number_format($transaction['amount'], 2),
            'retry_count' => $retryCount,
            'max_retries' => $this->maxRetries,
            'retry_date' => $retryDate,
            'update_payment_url' => $updatePaymentUrl
        ]);
        
        Mailer::send($transaction['email'], $subject, $body);
    }
    
    private function sendFinalFailureEmail(array $transaction, string $graceUntil): void {
        $graceDate = (new DateTime($graceUntil))->format('F j, Y');
        $updatePaymentUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/dashboard/billing';
        
        $subject = "Final Payment Attempt Failed - Grace Period Started";
        $body = $this->getEmailTemplate('final_failure', [
            'name' => $transaction['name'],
            'amount' => number_format($transaction['amount'], 2),
            'plan' => ucfirst($transaction['plan'] ?? 'subscription'),
            'grace_end_date' => $graceDate,
            'update_payment_url' => $updatePaymentUrl
        ]);
        
        Mailer::send($transaction['email'], $subject, $body);
    }
    
    private function sendRetrySuccessEmail(array $transaction): void {
        $dashboardUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/dashboard';
        
        $subject = "Payment Successful - Subscription Restored";
        $body = $this->getEmailTemplate('retry_success', [
            'name' => $transaction['name'],
            'amount' => number_format($transaction['amount'], 2),
            'plan' => ucfirst($transaction['plan'] ?? 'subscription'),
            'dashboard_url' => $dashboardUrl
        ]);
        
        Mailer::send($transaction['email'], $subject, $body);
    }
    
    private function sendGraceWarningEmail(array $user): void {
        $updatePaymentUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/dashboard/billing';
        $graceDate = (new DateTime($user['subscription_grace_until']))->format('F j, Y');
        
        $subject = "⚠️ Your Subscription Will Be Downgraded in 2 Days";
        $body = $this->getEmailTemplate('grace_warning', [
            'name' => $user['name'],
            'plan' => ucfirst($user['plan']),
            'grace_end_date' => $graceDate,
            'update_payment_url' => $updatePaymentUrl
        ]);
        
        Mailer::send($user['email'], $subject, $body);
    }
    
    private function sendGraceEndedEmail(array $user): void {
        $upgradeUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/subscription';
        
        $subject = "Your Subscription Has Been Downgraded";
        $body = $this->getEmailTemplate('grace_ended', [
            'name' => $user['name'],
            'previous_plan' => ucfirst($user['plan']),
            'upgrade_url' => $upgradeUrl
        ]);
        
        Mailer::send($user['email'], $subject, $body);
    }
    
    private function logNotification(int $userId, ?int $transactionId, string $type): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO payment_retry_notifications 
            (user_id, transaction_id, notification_type, email_sent)
            VALUES (?, ?, ?, 1)
        ");
        $stmt->execute([$userId, $transactionId, $type]);
    }
    
    private function getEmailTemplate(string $template, array $data): string {
        $baseStyles = "
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e3a5f, #0d1f33); padding: 30px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button.warning { background: #f59e0b; }
            .button.danger { background: #dc2626; }
            .alert { padding: 15px; border-radius: 8px; margin: 20px 0; }
            .alert-warning { background: #fef3c7; border: 1px solid #f59e0b; }
            .alert-danger { background: #fee2e2; border: 1px solid #dc2626; }
            .alert-success { background: #d1fae5; border: 1px solid #10b981; }
            .info-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
            .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .info-table td:first-child { font-weight: bold; color: #666; width: 40%; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        ";
        
        $templates = [
            'first_failure' => "
                <h2>Payment Could Not Be Processed</h2>
                <p>Hi {{name}},</p>
                <div class='alert alert-warning'>
                    <p><strong>Your payment of R{{amount}} for {{plan}} could not be processed.</strong></p>
                    <p>Reason: {{failure_reason}}</p>
                </div>
                <p>Don't worry - we'll automatically retry your payment on <strong>{{retry_date}}</strong>.</p>
                <p>To avoid any interruption to your service, please ensure your payment method is up to date:</p>
                <p style='text-align: center;'>
                    <a href='{{update_payment_url}}' class='button'>Update Payment Method</a>
                </p>
            ",
            'retry_scheduled' => "
                <h2>Payment Retry Scheduled</h2>
                <p>Hi {{name}},</p>
                <div class='alert alert-warning'>
                    <p>Retry attempt <strong>{{retry_count}} of {{max_retries}}</strong> for your R{{amount}} payment failed.</p>
                </div>
                <p>We will automatically try again on <strong>{{retry_date}}</strong>.</p>
                <p>Please update your payment details to ensure the next attempt is successful:</p>
                <p style='text-align: center;'>
                    <a href='{{update_payment_url}}' class='button warning'>Update Payment Method</a>
                </p>
            ",
            'final_failure' => "
                <h2>Final Payment Attempt Failed</h2>
                <p>Hi {{name}},</p>
                <div class='alert alert-danger'>
                    <p><strong>All payment attempts for your {{plan}} subscription have failed.</strong></p>
                </div>
                <p>Your subscription is now in a <strong>grace period</strong> until <strong>{{grace_end_date}}</strong>.</p>
                <p>During this time, you can continue using all features. After {{grace_end_date}}, your account will be downgraded to the Free plan.</p>
                <p>To keep your {{plan}} subscription, please update your payment method immediately:</p>
                <p style='text-align: center;'>
                    <a href='{{update_payment_url}}' class='button danger'>Update Payment Method Now</a>
                </p>
            ",
            'retry_success' => "
                <h2>Payment Successful!</h2>
                <p>Hi {{name}},</p>
                <div class='alert alert-success'>
                    <p><strong>Great news!</strong> Your payment of R{{amount}} has been successfully processed.</p>
                </div>
                <p>Your {{plan}} subscription is now active and fully restored.</p>
                <p style='text-align: center;'>
                    <a href='{{dashboard_url}}' class='button'>Go to Dashboard</a>
                </p>
            ",
            'grace_warning' => "
                <h2>⚠️ Urgent: Subscription Expires in 2 Days</h2>
                <p>Hi {{name}},</p>
                <div class='alert alert-danger'>
                    <p><strong>Your {{plan}} subscription grace period ends on {{grace_end_date}}.</strong></p>
                </div>
                <p>After this date, your account will be downgraded to the Free plan and you'll lose access to premium features.</p>
                <p>Update your payment method now to keep your subscription:</p>
                <p style='text-align: center;'>
                    <a href='{{update_payment_url}}' class='button danger'>Save My Subscription</a>
                </p>
            ",
            'grace_ended' => "
                <h2>Subscription Downgraded</h2>
                <p>Hi {{name}},</p>
                <div class='alert alert-warning'>
                    <p>Your {{previous_plan}} subscription has been downgraded to the Free plan due to payment issues.</p>
                </div>
                <p>All your data is safe and secure. However, some premium features are no longer available.</p>
                <p>Ready to upgrade again? It only takes a moment:</p>
                <p style='text-align: center;'>
                    <a href='{{upgrade_url}}' class='button'>Upgrade Now</a>
                </p>
            "
        ];
        
        $templateContent = $templates[$template] ?? '';
        
        // Replace placeholders
        foreach ($data as $key => $value) {
            $templateContent = str_replace('{{' . $key . '}}', htmlspecialchars($value), $templateContent);
        }
        
        return "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>{$baseStyles}</style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>IEOSUIA</h1>
                    </div>
                    <div class='content'>
                        {$templateContent}
                        <p>Best regards,<br>The IEOSUIA Team</p>
                    </div>
                    <div class='footer'>
                        <p>&copy; " . date('Y') . " IEOSUIA. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";
    }
}
