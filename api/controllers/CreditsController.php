<?php

class CreditsController {
    private $db;
    
    private $planLimits = [
        'free' => ['email' => 20, 'sms' => 0, 'invoices' => 30],
        'solo' => ['email' => 50, 'sms' => 10, 'invoices' => null],
        'pro' => ['email' => 100, 'sms' => 25, 'invoices' => null],
        'business' => ['email' => 200, 'sms' => 50, 'invoices' => null],
        'enterprise' => ['email' => 999999, 'sms' => 999999, 'invoices' => null],
    ];
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getUsage() {
        $userId = Auth::getUserId();
        
        $stmt = $this->db->prepare("
            SELECT 
                u.plan,
                u.email_credits,
                u.email_credits_used,
                u.sms_credits,
                u.sms_credits_used,
                u.credits_reset_at,
                pl.email_credits_monthly,
                pl.sms_credits_monthly,
                pl.invoices_monthly,
                pl.custom_branding,
                pl.auto_reminders,
                pl.advanced_reports,
                pl.multi_user,
                pl.priority_support,
                pl.monthly_price
            FROM users u
            LEFT JOIN plan_limits pl ON u.plan = pl.plan_name
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            Response::error('User not found', 404);
            return;
        }
        
        // Get current month invoice count
        $invoiceStmt = $this->db->prepare("
            SELECT COUNT(*) as count 
            FROM invoices 
            WHERE user_id = ? 
            AND MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $invoiceStmt->execute([$userId]);
        $invoiceCount = $invoiceStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Get recent notification activity
        $activityStmt = $this->db->prepare("
            SELECT type, COUNT(*) as count, DATE(created_at) as date
            FROM notification_logs
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY type, DATE(created_at)
            ORDER BY date DESC
        ");
        $activityStmt->execute([$userId]);
        $activity = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate days until reset
        $resetDate = new DateTime($user['credits_reset_at']);
        $resetDate->modify('+1 month');
        $now = new DateTime();
        $daysUntilReset = $now->diff($resetDate)->days;
        
        Response::json([
            'plan' => $user['plan'] ?? 'free',
            'credits' => [
                'email' => [
                    'total' => (int)$user['email_credits'],
                    'used' => (int)$user['email_credits_used'],
                    'remaining' => (int)$user['email_credits'] - (int)$user['email_credits_used'],
                    'monthly_limit' => (int)($user['email_credits_monthly'] ?? 20),
                ],
                'sms' => [
                    'total' => (int)$user['sms_credits'],
                    'used' => (int)$user['sms_credits_used'],
                    'remaining' => (int)$user['sms_credits'] - (int)$user['sms_credits_used'],
                    'monthly_limit' => (int)($user['sms_credits_monthly'] ?? 0),
                ],
                'invoices' => [
                    'used' => (int)$invoiceCount,
                    'limit' => $user['invoices_monthly'] ? (int)$user['invoices_monthly'] : null,
                    'unlimited' => $user['invoices_monthly'] === null,
                ],
            ],
            'reset_date' => $resetDate->format('Y-m-d'),
            'days_until_reset' => $daysUntilReset,
            'features' => [
                'custom_branding' => (bool)$user['custom_branding'],
                'auto_reminders' => (bool)$user['auto_reminders'],
                'advanced_reports' => (bool)$user['advanced_reports'],
                'multi_user' => (int)($user['multi_user'] ?? 1),
                'priority_support' => (bool)$user['priority_support'],
            ],
            'monthly_price' => (float)($user['monthly_price'] ?? 0),
            'activity' => $activity,
        ]);
    }
    
    public function useCredits() {
        $userId = Auth::getUserId();
        $data = Request::getBody();
        
        $type = $data['type'] ?? null; // 'email' or 'sms'
        $count = $data['count'] ?? 1;
        
        if (!in_array($type, ['email', 'sms'])) {
            Response::error('Invalid credit type', 400);
            return;
        }
        
        // Check available credits
        $stmt = $this->db->prepare("
            SELECT plan, {$type}_credits, {$type}_credits_used 
            FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $available = $user["{$type}_credits"] - $user["{$type}_credits_used"];
        
        if ($available < $count) {
            Response::json([
                'success' => false,
                'error' => 'Insufficient credits',
                'available' => $available,
                'required' => $count,
                'upgrade_required' => true,
            ], 402);
            return;
        }
        
        // Deduct credits
        $updateStmt = $this->db->prepare("
            UPDATE users SET {$type}_credits_used = {$type}_credits_used + ? WHERE id = ?
        ");
        $updateStmt->execute([$count, $userId]);
        
        Response::json([
            'success' => true,
            'credits_used' => $count,
            'remaining' => $available - $count,
        ]);
    }
    
    public function checkCredits() {
        $userId = Auth::getUserId();
        $type = $_GET['type'] ?? 'email';
        $count = (int)($_GET['count'] ?? 1);
        
        if (!in_array($type, ['email', 'sms'])) {
            Response::error('Invalid credit type', 400);
            return;
        }
        
        $stmt = $this->db->prepare("
            SELECT plan, {$type}_credits, {$type}_credits_used 
            FROM users WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $available = $user["{$type}_credits"] - $user["{$type}_credits_used"];
        
        Response::json([
            'available' => $available,
            'required' => $count,
            'sufficient' => $available >= $count,
            'plan' => $user['plan'] ?? 'free',
        ]);
    }
    
    public function getNotificationLogs() {
        $userId = Auth::getUserId();
        $type = $_GET['type'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        
        $sql = "
            SELECT nl.*, i.invoice_number
            FROM notification_logs nl
            LEFT JOIN invoices i ON nl.invoice_id = i.id
            WHERE nl.user_id = ?
        ";
        $params = [$userId];
        
        if ($type && in_array($type, ['email', 'sms'])) {
            $sql .= " AND nl.type = ?";
            $params[] = $type;
        }
        
        $sql .= " ORDER BY nl.created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['data' => $logs]);
    }
    
    public function logNotification($userId, $type, $recipient, $subject, $invoiceId, $status, $error = null) {
        $stmt = $this->db->prepare("
            INSERT INTO notification_logs 
            (user_id, type, recipient, subject, invoice_id, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $type, $recipient, $subject, $invoiceId, $status, $error]);
        
        return $this->db->lastInsertId();
    }
    
    public function resetMonthlyCredits() {
        // This should be called by a cron job at the start of each month
        $stmt = $this->db->prepare("
            UPDATE users u
            JOIN plan_limits pl ON u.plan = pl.plan_name
            SET 
                u.email_credits = pl.email_credits_monthly,
                u.email_credits_used = 0,
                u.sms_credits = pl.sms_credits_monthly,
                u.sms_credits_used = 0,
                u.credits_reset_at = CURRENT_DATE()
            WHERE u.credits_reset_at < DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
        ");
        $stmt->execute();
        
        Response::json([
            'message' => 'Monthly credits reset',
            'users_updated' => $stmt->rowCount(),
        ]);
    }
    
    public function getPlans() {
        $stmt = $this->db->prepare("SELECT * FROM plan_limits ORDER BY monthly_price ASC");
        $stmt->execute();
        $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add static plan data if DB is empty
        if (empty($plans)) {
            $plans = [
                [
                    'plan_name' => 'free',
                    'monthly_price' => 0,
                    'email_credits_monthly' => 20,
                    'sms_credits_monthly' => 0,
                    'invoices_monthly' => 30,
                    'custom_branding' => false,
                    'auto_reminders' => false,
                    'advanced_reports' => false,
                    'multi_user' => 1,
                    'priority_support' => false,
                ],
                [
                    'plan_name' => 'solo',
                    'monthly_price' => 149,
                    'email_credits_monthly' => 50,
                    'sms_credits_monthly' => 10,
                    'invoices_monthly' => null,
                    'custom_branding' => true,
                    'auto_reminders' => false,
                    'advanced_reports' => false,
                    'multi_user' => 1,
                    'priority_support' => false,
                ],
                [
                    'plan_name' => 'pro',
                    'monthly_price' => 299,
                    'email_credits_monthly' => 100,
                    'sms_credits_monthly' => 25,
                    'invoices_monthly' => null,
                    'custom_branding' => true,
                    'auto_reminders' => true,
                    'advanced_reports' => true,
                    'multi_user' => 1,
                    'priority_support' => true,
                ],
                [
                    'plan_name' => 'business',
                    'monthly_price' => 599,
                    'email_credits_monthly' => 200,
                    'sms_credits_monthly' => 50,
                    'invoices_monthly' => null,
                    'custom_branding' => true,
                    'auto_reminders' => true,
                    'advanced_reports' => true,
                    'multi_user' => 10,
                    'priority_support' => true,
                ],
            ];
        }
        
        Response::json(['data' => $plans]);
    }
}