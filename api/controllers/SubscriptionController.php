<?php

class SubscriptionController {
    
    /**
     * Process subscription renewal reminders
     * Should be called by a cron job daily
     * Sends reminder emails 3 days before renewal
     */
    public function processRenewalReminders(): void {
        $db = Database::getConnection();
        
        // Find users with subscriptions renewing in 3 days
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.name, u.plan, u.subscription_renewal_date,
                   pl.email_credits_monthly, pl.sms_credits_monthly
            FROM users u
            LEFT JOIN plan_limits pl ON u.plan = pl.plan_name
            WHERE u.plan IN ('solo', 'pro', 'business', 'enterprise')
            AND u.subscription_renewal_date IS NOT NULL
            AND DATE(u.subscription_renewal_date) = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            AND u.email_verified_at IS NOT NULL
        ");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $sent = 0;
        $failed = 0;
        $errors = [];
        
        foreach ($users as $user) {
            try {
                $renewalDate = new DateTime($user['subscription_renewal_date']);
                $emailSent = Mailer::sendSubscriptionRenewalEmail($user['email'], [
                    'name' => $user['name'],
                    'plan' => ucfirst($user['plan']),
                    'renewal_date' => $renewalDate->format('F j, Y'),
                    'email_credits' => $user['email_credits_monthly'] ?? 0,
                    'sms_credits' => $user['sms_credits_monthly'] ?? 0,
                ]);
                
                if ($emailSent) {
                    // Log that we sent the reminder
                    $logStmt = $db->prepare("
                        INSERT INTO notification_logs 
                        (user_id, type, recipient, subject, status, created_at)
                        VALUES (?, 'email', ?, ?, 'sent', NOW())
                    ");
                    $logStmt->execute([
                        $user['id'],
                        $user['email'],
                        'Subscription Renewal Reminder'
                    ]);
                    $sent++;
                } else {
                    $failed++;
                    $errors[] = ['user_id' => $user['id'], 'error' => 'Failed to send email'];
                }
            } catch (Exception $e) {
                $failed++;
                $errors[] = ['user_id' => $user['id'], 'error' => $e->getMessage()];
            }
        }
        
        Response::json([
            'success' => true,
            'message' => 'Processed subscription renewal reminders',
            'sent' => $sent,
            'failed' => $failed,
            'total' => count($users),
            'errors' => $errors,
        ]);
    }
    
    /**
     * Get current user's subscription details
     */
    public function getSubscription(): void {
        $user = Auth::user();
        
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $db = Database::getConnection();
        
        // Get plan limits
        $stmt = $db->prepare("SELECT * FROM plan_limits WHERE plan_name = ?");
        $stmt->execute([$user['plan'] ?? 'free']);
        $planLimits = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get subscription history
        $stmt = $db->prepare("
            SELECT * FROM subscription_history 
            WHERE user_id = ? 
            ORDER BY started_at DESC 
            LIMIT 10
        ");
        $stmt->execute([$user['id']]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'plan' => $user['plan'] ?? 'free',
            'renewal_date' => $user['subscription_renewal_date'] ?? null,
            'limits' => $planLimits,
            'email_credits' => $user['email_credits'] ?? 0,
            'email_credits_used' => $user['email_credits_used'] ?? 0,
            'sms_credits' => $user['sms_credits'] ?? 0,
            'sms_credits_used' => $user['sms_credits_used'] ?? 0,
            'history' => $history,
        ]);
    }
    
    /**
     * Update subscription renewal date (after successful payment)
     */
    public function updateRenewalDate(): void {
        $request = new Request();
        $renewalDate = $request->input('renewal_date');
        
        if (!$renewalDate) {
            // Default to 1 month from now
            $renewalDate = (new DateTime())->modify('+1 month')->format('Y-m-d');
        }
        
        $db = Database::getConnection();
        $stmt = $db->prepare("
            UPDATE users 
            SET subscription_renewal_date = ? 
            WHERE id = ?
        ");
        $stmt->execute([$renewalDate, Auth::id()]);
        
        Response::json([
            'success' => true,
            'renewal_date' => $renewalDate,
        ]);
    }
    
    /**
     * Process expired subscriptions
     * Should be called by a cron job daily
     * Downgrades users whose subscription has expired
     */
    public function processExpired(): void {
        $db = Database::getConnection();
        
        // Find users with expired subscriptions (renewal date in the past)
        $stmt = $db->prepare("
            SELECT id, email, name, plan, subscription_renewal_date
            FROM users 
            WHERE plan IN ('solo', 'pro', 'business', 'enterprise')
            AND subscription_renewal_date IS NOT NULL
            AND subscription_renewal_date < CURDATE()
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
                    SET ended_at = NOW(), status = 'expired'
                    WHERE user_id = ? AND status = 'active'
                ")->execute([$user['id']]);
                
                // Downgrade to free plan
                $db->prepare("
                    UPDATE users 
                    SET plan = 'free', 
                        subscription_renewal_date = NULL,
                        email_credits = 10,
                        sms_credits = 5
                    WHERE id = ?
                ")->execute([$user['id']]);
                
                // Log new subscription record
                $db->prepare("
                    INSERT INTO subscription_history (user_id, plan, started_at, status)
                    VALUES (?, 'free', NOW(), 'active')
                ")->execute([$user['id']]);
                
                // Send notification email
                Mailer::send(
                    $user['email'],
                    'Your Subscription Has Expired - IEOSUIA',
                    self::getExpiredEmailBody($user['name'], $user['plan'])
                );
                
                $processed++;
            } catch (Exception $e) {
                $errors[] = ['user_id' => $user['id'], 'error' => $e->getMessage()];
            }
        }
        
        Response::json([
            'success' => true,
            'message' => 'Processed expired subscriptions',
            'processed' => $processed,
            'total' => count($expiredUsers),
            'errors' => $errors,
        ]);
    }
    
    private static function getExpiredEmailBody(string $name, string $plan): string {
        $upgradeUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . '/subscription';
        
        return "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a5f, #0d1f33); padding: 30px; text-align: center; }
                    .header h1 { color: #fff; margin: 0; font-size: 24px; }
                    .content { padding: 30px; }
                    .button { display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                    .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>IEOSUIA</h1>
                    </div>
                    <div class='content'>
                        <h2>Subscription Expired</h2>
                        <p>Hi {$name},</p>
                        <div class='alert'>
                            <p>Your <strong>" . ucfirst($plan) . "</strong> subscription has expired and your account has been downgraded to the Free plan.</p>
                        </div>
                        <p>Don't worry - all your data is safe! However, you may have limited access to some features.</p>
                        <p>To restore full access to all features, please renew your subscription:</p>
                        <p style='text-align: center;'>
                            <a href='{$upgradeUrl}' class='button'>Renew Subscription</a>
                        </p>
                        <p>If you have any questions, please contact our support team.</p>
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
