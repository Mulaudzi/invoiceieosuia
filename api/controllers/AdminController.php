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
            SET session_token = ?, expires_at = ?, step = 3 
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
            AND step = 3 
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
        
        // Log the update
        AdminActivityLogger::logSubmission('submission_updated', (int)$id, ['changed_fields' => array_keys($filtered)]);
        
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
        
        // Get submission info before deletion for logging
        $stmt = $db->prepare("SELECT email, name FROM contact_submissions WHERE id = ?");
        $stmt->execute([$id]);
        $submissionInfo = $stmt->fetch();
        
        // Delete related email logs first
        $stmt = $db->prepare("DELETE FROM email_logs WHERE contact_submission_id = ?");
        $stmt->execute([$id]);
        
        // Delete submission
        $stmt = $db->prepare("DELETE FROM contact_submissions WHERE id = ?");
        $stmt->execute([$id]);
        
        // Log deletion
        AdminActivityLogger::logSubmission('submission_deleted', (int)$id, [
            'deleted_email' => $submissionInfo['email'] ?? 'unknown',
            'deleted_name' => $submissionInfo['name'] ?? 'unknown'
        ]);
        
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
        
        if ($stmt->rowCount() > 0) {
            AdminActivityLogger::logSubmission('submission_marked_read', (int)$id);
        }
        
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
        
        // Submissions trend (last 30 days) - fill in missing dates with 0
        $stmt = $db->query("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM contact_submissions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $rawTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fill missing dates with 0 count
        $dailyTrend = [];
        $trendMap = array_column($rawTrend, 'count', 'date');
        for ($i = 29; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $dailyTrend[] = [
                'date' => $date,
                'count' => isset($trendMap[$date]) ? (int)$trendMap[$date] : 0
            ];
        }
        
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
     * Export email logs as CSV
     */
    public function exportEmailLogs(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $status = $request->query('status');
        $type = $request->query('type');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
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
        
        if ($startDate) {
            $where[] = 'created_at >= ?';
            $params[] = $startDate . ' 00:00:00';
        }
        
        if ($endDate) {
            $where[] = 'created_at <= ?';
            $params[] = $endDate . ' 23:59:59';
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $stmt = $db->prepare("
            SELECT 
                el.id,
                el.recipient_email,
                el.subject,
                el.email_type as type,
                el.status,
                el.error_message,
                el.bounce_type,
                el.sent_at,
                el.created_at,
                cs.name as contact_name,
                cs.email as contact_email
            FROM email_logs el
            LEFT JOIN contact_submissions cs ON el.contact_submission_id = cs.id
            $whereClause 
            ORDER BY el.created_at DESC
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'data' => $logs,
            'export_date' => date('Y-m-d H:i:s'),
            'total' => count($logs)
        ]);
    }
    
    /**
     * Export submissions as CSV
     */
    public function exportSubmissions(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $status = $request->query('status');
        $purpose = $request->query('purpose');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
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
        
        if ($startDate) {
            $where[] = 'created_at >= ?';
            $params[] = $startDate . ' 00:00:00';
        }
        
        if ($endDate) {
            $where[] = 'created_at <= ?';
            $params[] = $endDate . ' 23:59:59';
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $stmt = $db->prepare("
            SELECT 
                id,
                name,
                email,
                purpose,
                message,
                status,
                created_at,
                responded_at,
                notes
            FROM contact_submissions
            $whereClause 
            ORDER BY created_at DESC
        ");
        $stmt->execute($params);
        $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'data' => $submissions,
            'export_date' => date('Y-m-d H:i:s'),
            'total' => count($submissions)
        ]);
    }
    
    /**
     * Get statistics report data
     */
    public function getStatisticsReport(): void {
        if (!self::verifyAdminToken()) return;
        
        $db = Database::getConnection();
        
        // Monthly submission stats
        $stmt = $db->query("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'responded' THEN 1 ELSE 0 END) as responded,
                SUM(CASE WHEN purpose = 'general' THEN 1 ELSE 0 END) as general,
                SUM(CASE WHEN purpose = 'support' THEN 1 ELSE 0 END) as support,
                SUM(CASE WHEN purpose = 'sales' THEN 1 ELSE 0 END) as sales
            FROM contact_submissions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ");
        $monthlySubmissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Monthly email stats
        $stmt = $db->query("
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
            FROM email_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ");
        $monthlyEmails = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'monthly_submissions' => $monthlySubmissions,
            'monthly_emails' => $monthlyEmails,
            'generated_at' => date('Y-m-d H:i:s')
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
        
        // Log settings change
        AdminActivityLogger::logSettings('notification_settings_updated', [
            'notification_type' => $notificationType,
            'enabled' => $data['enabled'] ?? null
        ]);
        
        Response::json(['success' => true, 'message' => 'Settings updated']);
    }
    
    // ==================== Helper Methods ====================
    
    private function createAdminSession(string $token, string $ip, int $step): void {
        $db = Database::getConnection();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+5 minutes')); // 5 min to complete login
        
        // Clean up old sessions for this IP
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE ip_address = ? AND step < 3");
        $stmt->execute([$ip]);
        
        $stmt = $db->prepare("
            INSERT INTO admin_sessions (session_token, ip_address, step, expires_at) 
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
            AND step = ? 
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
            SET step = ?, expires_at = ?, last_activity = NOW() 
            WHERE session_token = ?
        ");
        $stmt->execute([$step, $newExpiry, $token]);
    }
    
    private function deleteAdminSession(string $token): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE session_token = ?");
        $stmt->execute([$token]);
    }
    
    // ==================== Session Management ====================
    
    /**
     * Get all active admin sessions
     */
    public function getActiveSessions(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $currentToken = $request->bearerToken();
        
        $db = Database::getConnection();
        
        // Get all active sessions (step = 3 and not expired)
        $stmt = $db->query("
            SELECT 
                id,
                session_token,
                ip_address,
                admin_user_id,
                last_activity,
                created_at,
                expires_at
            FROM admin_sessions 
            WHERE step = 3 AND expires_at > NOW()
            ORDER BY last_activity DESC
        ");
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add current session flag and admin user info
        foreach ($sessions as &$session) {
            $session['is_current'] = $session['session_token'] === $currentToken;
            // Mask the token for security
            $session['session_token_masked'] = substr($session['session_token'], 0, 8) . '...' . substr($session['session_token'], -8);
            unset($session['session_token']); // Don't expose full token
            
            // Get admin user info if available
            if ($session['admin_user_id']) {
                $userStmt = $db->prepare("SELECT name, email FROM admin_users WHERE id = ?");
                $userStmt->execute([$session['admin_user_id']]);
                $adminUser = $userStmt->fetch(PDO::FETCH_ASSOC);
                $session['admin_name'] = $adminUser['name'] ?? 'Unknown';
                $session['admin_email'] = $adminUser['email'] ?? 'Unknown';
            } else {
                $session['admin_name'] = 'Legacy Session';
                $session['admin_email'] = 'N/A';
            }
            
            // Calculate time remaining
            $expiresAt = new DateTime($session['expires_at']);
            $now = new DateTime();
            $remaining = $now->diff($expiresAt);
            $session['time_remaining'] = $remaining->h . 'h ' . $remaining->i . 'm';
            
            // Format last activity for display
            $lastActivity = new DateTime($session['last_activity']);
            $session['last_activity_ago'] = $this->timeAgo($lastActivity);
        }
        
        Response::json([
            'sessions' => $sessions,
            'total' => count($sessions)
        ]);
    }
    
    /**
     * Terminate a specific admin session
     */
    public function terminateSession(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $sessionId = Request::param('id');
        $currentToken = $request->bearerToken();
        
        if (!$sessionId) {
            Response::error('Session ID required', 400);
            return;
        }
        
        $db = Database::getConnection();
        
        // Get the session to terminate
        $stmt = $db->prepare("SELECT session_token, ip_address FROM admin_sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            Response::error('Session not found', 404);
            return;
        }
        
        // Don't allow terminating own session
        if ($session['session_token'] === $currentToken) {
            Response::error('Cannot terminate your own session. Use logout instead.', 400);
            return;
        }
        
        // Delete the session
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
        
        // Log the action
        AdminActivityLogger::logSettings('session_terminated', [
            'terminated_session_id' => $sessionId,
            'terminated_ip' => $session['ip_address']
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Session terminated successfully'
        ]);
    }
    
    /**
     * Terminate all other admin sessions (keep current)
     */
    public function terminateAllSessions(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $currentToken = $request->bearerToken();
        
        $db = Database::getConnection();
        
        // Count sessions to be terminated
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM admin_sessions 
            WHERE session_token != ? AND step = 3 AND expires_at > NOW()
        ");
        $stmt->execute([$currentToken]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Delete all other sessions
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE session_token != ?");
        $stmt->execute([$currentToken]);
        
        // Log the action
        AdminActivityLogger::logSettings('all_sessions_terminated', [
            'terminated_count' => $count
        ]);
        
        Response::json([
            'success' => true,
            'message' => "Terminated $count other session(s)",
            'terminated_count' => $count
        ]);
    }
    
    /**
     * Get helper - time ago string
     */
    private function timeAgo(DateTime $datetime): string {
        $now = new DateTime();
        $diff = $now->diff($datetime);
        
        if ($diff->y > 0) return $diff->y . ' year(s) ago';
        if ($diff->m > 0) return $diff->m . ' month(s) ago';
        if ($diff->d > 0) return $diff->d . ' day(s) ago';
        if ($diff->h > 0) return $diff->h . ' hour(s) ago';
        if ($diff->i > 0) return $diff->i . ' minute(s) ago';
        return 'Just now';
    }
    
    // ==================== Activity Logs ====================
    
    /**
     * Get admin activity logs
     */
    public function getActivityLogs(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $page = (int)($request->query('page') ?? 1);
        $perPage = (int)($request->query('per_page') ?? 50);
        $category = $request->query('category');
        $action = $request->query('action');
        $adminUserId = $request->query('admin_user_id');
        $status = $request->query('status');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
        $result = AdminActivityLogger::getLogs(
            $page,
            $perPage,
            $category ?: null,
            $action ?: null,
            $adminUserId ? (int)$adminUserId : null,
            $status ?: null,
            $startDate ?: null,
            $endDate ?: null
        );
        
        Response::json($result);
    }
    
    /**
     * Export activity logs to CSV
     */
    public function exportActivityLogs(): void {
        if (!self::verifyAdminToken()) return;
        
        $request = new Request();
        $category = $request->query('category');
        $status = $request->query('status');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
        // Get all logs matching filters (no pagination for export)
        $db = Database::getConnection();
        
        $where = [];
        $params = [];
        
        if ($category) {
            $where[] = 'aal.category = ?';
            $params[] = $category;
        }
        if ($status) {
            $where[] = 'aal.status = ?';
            $params[] = $status;
        }
        if ($startDate) {
            $where[] = 'aal.created_at >= ?';
            $params[] = $startDate . ' 00:00:00';
        }
        if ($endDate) {
            $where[] = 'aal.created_at <= ?';
            $params[] = $endDate . ' 23:59:59';
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $stmt = $db->prepare("
            SELECT aal.*, au.name as admin_name
            FROM admin_activity_logs aal
            LEFT JOIN admin_users au ON aal.admin_user_id = au.id
            $whereClause
            ORDER BY aal.created_at DESC
            LIMIT 10000
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log export action
        AdminActivityLogger::logSettings('activity_logs_exported', ['count' => count($logs)]);
        
        // Generate CSV
        $csv = "ID,Timestamp,Admin Name,Admin Email,Action,Category,Target Type,Target ID,Status,IP Address,Details\n";
        
        foreach ($logs as $log) {
            $details = $log['details'] ? str_replace('"', '""', $log['details']) : '';
            $csv .= sprintf(
                "%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,\"%s\",\"%s\",\"%s\"\n",
                $log['id'],
                $log['created_at'],
                $log['admin_name'] ?? '',
                $log['admin_email'] ?? '',
                $log['action'],
                $log['category'],
                $log['target_type'] ?? '',
                $log['target_id'] ?? '',
                $log['status'],
                $log['ip_address'] ?? '',
                $details
            );
        }
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="activity_logs_' . date('Y-m-d') . '.csv"');
        echo $csv;
        exit;
    }
}