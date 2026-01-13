<?php

/**
 * Admin Authentication Controller
 * Special 3-step password authentication for admin access
 */
class AdminController {
    
    // Hardcoded admin credentials - 3 passwords required in sequence
    private const ADMIN_USERNAME = 'I Am God In Human Form';
    private const ADMIN_PASSWORDS = [
        'billionaires',
        'Mu1@udz!',
        '7211018830'
    ];
    
    /**
     * Step 1: Validate username and first password
     */
    public function loginStep1(): void {
        $request = new Request();
        $data = $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);
        
        // Rate limit: 3 attempts per 30 minutes per IP
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $rateLimiter = new RateLimitMiddleware(3, 30);
        if (!$rateLimiter->handle('admin_login:' . $ip)) {
            return;
        }
        
        // Verify username and first password
        if ($data['username'] !== self::ADMIN_USERNAME || 
            $data['password'] !== self::ADMIN_PASSWORDS[0]) {
            $rateLimiter->hit();
            error_log("Failed admin login attempt (step 1) from IP: $ip");
            Response::error('Invalid credentials', 401);
            return;
        }
        
        // Create admin session token for next step
        $sessionToken = bin2hex(random_bytes(32));
        $this->createAdminSession($sessionToken, $ip, 1);
        
        Response::json([
            'success' => true,
            'step' => 1,
            'session_token' => $sessionToken,
            'message' => 'Step 1 complete. Please enter second password.'
        ]);
    }
    
    /**
     * Step 2: Validate second password
     */
    public function loginStep2(): void {
        $request = new Request();
        $data = $request->validate([
            'session_token' => 'required',
            'password' => 'required',
        ]);
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Validate session
        $session = $this->validateAdminSession($data['session_token'], $ip, 1);
        if (!$session) {
            Response::error('Invalid or expired session', 401);
            return;
        }
        
        // Verify second password
        if ($data['password'] !== self::ADMIN_PASSWORDS[1]) {
            $this->deleteAdminSession($data['session_token']);
            error_log("Failed admin login attempt (step 2) from IP: $ip");
            Response::error('Invalid credentials', 401);
            return;
        }
        
        // Update session to step 2
        $this->updateAdminSessionStep($data['session_token'], 2);
        
        Response::json([
            'success' => true,
            'step' => 2,
            'session_token' => $data['session_token'],
            'message' => 'Step 2 complete. Please enter third password.'
        ]);
    }
    
    /**
     * Step 3: Validate third password and grant access
     */
    public function loginStep3(): void {
        $request = new Request();
        $data = $request->validate([
            'session_token' => 'required',
            'password' => 'required',
        ]);
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Validate session at step 2
        $session = $this->validateAdminSession($data['session_token'], $ip, 2);
        if (!$session) {
            Response::error('Invalid or expired session', 401);
            return;
        }
        
        // Verify third password
        if ($data['password'] !== self::ADMIN_PASSWORDS[2]) {
            $this->deleteAdminSession($data['session_token']);
            error_log("Failed admin login attempt (step 3) from IP: $ip");
            Response::error('Invalid credentials', 401);
            return;
        }
        
        // Generate admin access token (valid for 8 hours)
        $adminToken = bin2hex(random_bytes(32));
        $this->updateAdminSessionStep($data['session_token'], 3);
        
        // Update session with final token
        $db = Database::getConnection();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));
        $stmt = $db->prepare("
            UPDATE admin_sessions 
            SET session_token = ?, expires_at = ?, auth_step = 3 
            WHERE session_token = ?
        ");
        $stmt->execute([$adminToken, $expiresAt, $data['session_token']]);
        
        error_log("Admin login successful from IP: $ip");
        
        Response::json([
            'success' => true,
            'step' => 3,
            'admin_token' => $adminToken,
            'message' => 'Authentication complete. Welcome, Admin.',
            'expires_in' => 8 * 60 * 60 // 8 hours in seconds
        ]);
    }
    
    /**
     * Logout admin session
     */
    public function logout(): void {
        $request = new Request();
        $token = $request->bearerToken() ?? $request->input('admin_token');
        
        if ($token) {
            $this->deleteAdminSession($token);
        }
        
        Response::json(['success' => true, 'message' => 'Logged out']);
    }
    
    /**
     * Verify admin token middleware check
     */
    public static function verifyAdminToken(): bool {
        $request = new Request();
        $token = $request->bearerToken();
        
        if (!$token) {
            Response::error('Admin token required', 401);
            return false;
        }
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT * FROM admin_sessions 
            WHERE session_token = ? 
            AND ip_address = ?
            AND auth_step = 3 
            AND expires_at > NOW()
        ");
        $stmt->execute([$token, $ip]);
        $session = $stmt->fetch();
        
        if (!$session) {
            Response::error('Invalid or expired admin session', 401);
            return false;
        }
        
        // Update last activity
        $stmt = $db->prepare("UPDATE admin_sessions SET last_activity = NOW() WHERE session_token = ?");
        $stmt->execute([$token]);
        
        return true;
    }
    
    // ==================== Contact Submissions Management ====================
    
    /**
     * Get all contact submissions
     */
    public function getSubmissions(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $status = $request->query('status');
        $purpose = $request->query('purpose');
        $page = (int)($request->query('page') ?? 1);
        $perPage = (int)($request->query('per_page') ?? 20);
        $offset = ($page - 1) * $perPage;
        
        $db = Database::getConnection();
        
        $where = [];
        $params = [];
        
        if ($status) {
            $where[] = 'status = ?';
            $params[] = $status;
        }
        
        if ($purpose) {
            $where[] = 'purpose = ?';
            $params[] = $purpose;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM contact_submissions $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get submissions
        $params[] = $perPage;
        $params[] = $offset;
        $stmt = $db->prepare("
            SELECT * FROM contact_submissions 
            $whereClause 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $submissions = $stmt->fetchAll();
        
        Response::json([
            'data' => $submissions,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage)
        ]);
    }
    
    /**
     * Get single submission
     */
    public function getSubmission(): void {
        if (!self::verifyAdminToken()) return;
        
        $id = Request::param('id');
        $db = Database::getConnection();
        
        $stmt = $db->prepare("SELECT * FROM contact_submissions WHERE id = ?");
        $stmt->execute([$id]);
        $submission = $stmt->fetch();
        
        if (!$submission) {
            Response::error('Submission not found', 404);
            return;
        }
        
        // Get related email logs
        $stmt = $db->prepare("
            SELECT * FROM email_logs 
            WHERE contact_submission_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$id]);
        $emailLogs = $stmt->fetchAll();
        
        $submission['email_logs'] = $emailLogs;
        
        Response::json($submission);
    }
    
    /**
     * Update submission status
     */
    public function updateSubmission(): void {
        if (!self::verifyAdminToken()) return;
        
        $id = Request::param('id');
        $request = new Request();
        $data = $request->all();
        
        $allowed = ['status', 'notes'];
        $filtered = array_intersect_key($data, array_flip($allowed));
        
        if (isset($filtered['status']) && $filtered['status'] === 'responded') {
            $filtered['responded_at'] = date('Y-m-d H:i:s');
        }
        
        if (empty($filtered)) {
            Response::error('No valid fields to update', 422);
            return;
        }
        
        $db = Database::getConnection();
        $sets = [];
        $params = [];
        
        foreach ($filtered as $key => $value) {
            $sets[] = "$key = ?";
            $params[] = $value;
        }
        
        $params[] = $id;
        $stmt = $db->prepare("UPDATE contact_submissions SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        
        // Get updated submission
        $stmt = $db->prepare("SELECT * FROM contact_submissions WHERE id = ?");
        $stmt->execute([$id]);
        $submission = $stmt->fetch();
        
        Response::json($submission);
    }
    
    /**
     * Delete submission
     */
    public function deleteSubmission(): void {
        if (!self::verifyAdminToken()) return;
        
        $id = Request::param('id');
        $db = Database::getConnection();
        
        // Delete related email logs first
        $stmt = $db->prepare("DELETE FROM email_logs WHERE contact_submission_id = ?");
        $stmt->execute([$id]);
        
        // Delete submission
        $stmt = $db->prepare("DELETE FROM contact_submissions WHERE id = ?");
        $stmt->execute([$id]);
        
        Response::json(['success' => true, 'message' => 'Submission deleted']);
    }
    
    /**
     * Mark submission as read
     */
    public function markAsRead(): void {
        if (!self::verifyAdminToken()) return;
        
        $id = Request::param('id');
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            UPDATE contact_submissions 
            SET status = 'read' 
            WHERE id = ? AND status = 'new'
        ");
        $stmt->execute([$id]);
        
        Response::json(['success' => true]);
    }
    
    // ==================== Email Logs ====================
    
    /**
     * Get all email logs
     */
    public function getEmailLogs(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $status = $request->query('status');
        $type = $request->query('type');
        $page = (int)($request->query('page') ?? 1);
        $perPage = (int)($request->query('per_page') ?? 50);
        $offset = ($page - 1) * $perPage;
        
        $db = Database::getConnection();
        
        $where = [];
        $params = [];
        
        if ($status) {
            $where[] = 'status = ?';
            $params[] = $status;
        }
        
        if ($type) {
            $where[] = 'email_type = ?';
            $params[] = $type;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM email_logs $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get logs
        $params[] = $perPage;
        $params[] = $offset;
        $stmt = $db->prepare("
            SELECT el.*, cs.name as contact_name, cs.email as contact_email
            FROM email_logs el
            LEFT JOIN contact_submissions cs ON el.contact_submission_id = cs.id
            $whereClause 
            ORDER BY el.created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        
        Response::json([
            'data' => $logs,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage)
        ]);
    }
    
    /**
     * Get dashboard stats with enhanced analytics
     */
    public function getDashboard(): void {
        if (!self::verifyAdminToken()) return;
        
        $db = Database::getConnection();
        
        // Contact submissions stats
        $stmt = $db->query("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
                SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN status = 'responded' THEN 1 ELSE 0 END) as responded_count,
                SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count,
                SUM(CASE WHEN purpose = 'general' THEN 1 ELSE 0 END) as general_count,
                SUM(CASE WHEN purpose = 'support' THEN 1 ELSE 0 END) as support_count,
                SUM(CASE WHEN purpose = 'sales' THEN 1 ELSE 0 END) as sales_count
            FROM contact_submissions
        ");
        $submissionStats = $stmt->fetch();
        
        // Today's submissions
        $stmt = $db->query("
            SELECT COUNT(*) as count 
            FROM contact_submissions 
            WHERE DATE(created_at) = CURDATE()
        ");
        $todaySubmissions = $stmt->fetch()['count'];
        
        // This week's submissions
        $stmt = $db->query("
            SELECT COUNT(*) as count 
            FROM contact_submissions 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ");
        $weekSubmissions = $stmt->fetch()['count'];
        
        // This month's submissions
        $stmt = $db->query("
            SELECT COUNT(*) as count 
            FROM contact_submissions 
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        ");
        $monthSubmissions = $stmt->fetch()['count'];
        
        // Calculate response rate (responded / total)
        $totalSubmissions = (int)$submissionStats['total'];
        $respondedCount = (int)$submissionStats['responded_count'];
        $responseRate = $totalSubmissions > 0 ? round(($respondedCount / $totalSubmissions) * 100, 1) : 0;
        
        // Calculate average response time (for submissions that have been responded to)
        $stmt = $db->query("
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, responded_at)) as avg_hours
            FROM contact_submissions 
            WHERE status = 'responded' AND responded_at IS NOT NULL
        ");
        $avgResponseResult = $stmt->fetch();
        $avgResponseHours = $avgResponseResult['avg_hours'] ? round($avgResponseResult['avg_hours'], 1) : null;
        
        // Email logs stats
        $stmt = $db->query("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
            FROM email_logs
        ");
        $emailStats = $stmt->fetch();
        
        // Email delivery rate
        $totalEmails = (int)$emailStats['total'];
        $sentEmails = (int)$emailStats['sent_count'];
        $deliveryRate = $totalEmails > 0 ? round(($sentEmails / $totalEmails) * 100, 1) : 0;
        
        // Bounce rate
        $bouncedEmails = (int)$emailStats['bounced_count'];
        $bounceRate = $totalEmails > 0 ? round(($bouncedEmails / $totalEmails) * 100, 1) : 0;
        
        // Submissions trend (last 7 days)
        $stmt = $db->query("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM contact_submissions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $dailyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Recent submissions
        $stmt = $db->query("
            SELECT * FROM contact_submissions 
            ORDER BY created_at DESC 
            LIMIT 5
        ");
        $recentSubmissions = $stmt->fetchAll();
        
        // Recent failed emails
        $stmt = $db->query("
            SELECT * FROM email_logs 
            WHERE status IN ('failed', 'bounced')
            ORDER BY created_at DESC 
            LIMIT 5
        ");
        $recentFailedEmails = $stmt->fetchAll();
        
        Response::json([
            'submissions' => [
                'total' => $totalSubmissions,
                'new' => (int)$submissionStats['new_count'],
                'read' => (int)$submissionStats['read_count'],
                'responded' => $respondedCount,
                'archived' => (int)$submissionStats['archived_count'],
                'today' => (int)$todaySubmissions,
                'this_week' => (int)$weekSubmissions,
                'this_month' => (int)$monthSubmissions,
                'response_rate' => $responseRate,
                'avg_response_hours' => $avgResponseHours,
                'by_purpose' => [
                    'general' => (int)$submissionStats['general_count'],
                    'support' => (int)$submissionStats['support_count'],
                    'sales' => (int)$submissionStats['sales_count'],
                ],
                'daily_trend' => $dailyTrend,
            ],
            'emails' => [
                'total' => $totalEmails,
                'sent' => $sentEmails,
                'failed' => (int)$emailStats['failed_count'],
                'bounced' => $bouncedEmails,
                'pending' => (int)$emailStats['pending_count'],
                'delivery_rate' => $deliveryRate,
                'bounce_rate' => $bounceRate,
            ],
            'recent_submissions' => $recentSubmissions,
            'recent_failed_emails' => $recentFailedEmails,
        ]);
    }
    
    /**
     * Get notification settings
     */
    public function getNotificationSettings(): void {
        if (!self::verifyAdminToken()) return;
        
        $db = Database::getConnection();
        
        try {
            $stmt = $db->query("SELECT * FROM admin_notification_settings ORDER BY notification_type");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json(['settings' => $settings]);
        } catch (\Exception $e) {
            // Table might not exist
            Response::json(['settings' => []]);
        }
    }
    
    /**
     * Update notification settings
     */
    public function updateNotificationSettings(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $data = $request->all();
        
        $notificationType = $data['notification_type'] ?? '';
        
        if (empty($notificationType)) {
            Response::error('Notification type is required', 400);
            return;
        }
        
        $db = Database::getConnection();
        
        $updates = [];
        $params = [];
        
        if (isset($data['enabled'])) {
            $updates[] = 'enabled = ?';
            $params[] = $data['enabled'] ? 1 : 0;
        }
        
        if (isset($data['email_recipients'])) {
            $updates[] = 'email_recipients = ?';
            $params[] = trim($data['email_recipients']);
        }
        
        if (empty($updates)) {
            Response::error('No updates provided', 400);
            return;
        }
        
        $params[] = $notificationType;
        
        $stmt = $db->prepare("
            UPDATE admin_notification_settings 
            SET " . implode(', ', $updates) . "
            WHERE notification_type = ?
        ");
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            // Insert if doesn't exist
            $stmt = $db->prepare("
                INSERT INTO admin_notification_settings (notification_type, enabled, email_recipients)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([
                $notificationType,
                $data['enabled'] ?? true ? 1 : 0,
                $data['email_recipients'] ?? ''
            ]);
        }
        
        Response::json(['success' => true, 'message' => 'Settings updated']);
    }
    
    // ==================== Helper Methods ====================
    
    private function createAdminSession(string $token, string $ip, int $step): void {
        $db = Database::getConnection();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+5 minutes')); // 5 min to complete login
        
        // Clean up old sessions for this IP
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE ip_address = ? AND auth_step < 3");
        $stmt->execute([$ip]);
        
        $stmt = $db->prepare("
            INSERT INTO admin_sessions (session_token, ip_address, auth_step, expires_at) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$token, $ip, $step, $expiresAt]);
    }
    
    private function validateAdminSession(string $token, string $ip, int $expectedStep): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT * FROM admin_sessions 
            WHERE session_token = ? 
            AND ip_address = ? 
            AND auth_step = ? 
            AND expires_at > NOW()
        ");
        $stmt->execute([$token, $ip, $expectedStep]);
        return $stmt->fetch() ?: null;
    }
    
    private function updateAdminSessionStep(string $token, int $step): void {
        $db = Database::getConnection();
        $newExpiry = date('Y-m-d H:i:s', strtotime('+5 minutes'));
        $stmt = $db->prepare("
            UPDATE admin_sessions 
            SET auth_step = ?, expires_at = ?, last_activity = NOW() 
            WHERE session_token = ?
        ");
        $stmt->execute([$step, $newExpiry, $token]);
    }
    
    private function deleteAdminSession(string $token): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE session_token = ?");
        $stmt->execute([$token]);
    }
}