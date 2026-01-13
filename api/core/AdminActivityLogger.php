<?php

/**
 * Admin Activity Logger
 * Centralized logging for all admin actions for security auditing
 */
class AdminActivityLogger {
    
    /**
     * Log an admin activity
     */
    public static function log(
        string $action,
        string $category = 'system',
        ?string $targetType = null,
        ?int $targetId = null,
        ?array $details = null,
        string $status = 'success',
        ?int $adminUserId = null,
        ?string $adminEmail = null
    ): void {
        try {
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                INSERT INTO admin_activity_logs 
                (admin_user_id, admin_email, action, category, target_type, target_id, details, ip_address, user_agent, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $adminUserId,
                $adminEmail,
                $action,
                $category,
                $targetType,
                $targetId,
                $details ? json_encode($details) : null,
                self::getClientIp(),
                self::getUserAgent(),
                $status
            ]);
        } catch (Exception $e) {
            // Don't let logging failures affect the main flow
            error_log("Failed to log admin activity: " . $e->getMessage());
        }
    }
    
    /**
     * Log auth-related activities
     */
    public static function logAuth(
        string $action,
        string $status = 'success',
        ?int $adminUserId = null,
        ?string $adminEmail = null,
        ?array $details = null
    ): void {
        self::log($action, 'auth', null, null, $details, $status, $adminUserId, $adminEmail);
    }
    
    /**
     * Log user management activities
     */
    public static function logUserManagement(
        string $action,
        ?int $targetAdminId = null,
        ?array $details = null,
        string $status = 'success',
        ?int $adminUserId = null,
        ?string $adminEmail = null
    ): void {
        self::log($action, 'user_management', 'admin_user', $targetAdminId, $details, $status, $adminUserId, $adminEmail);
    }
    
    /**
     * Log submission-related activities
     */
    public static function logSubmission(
        string $action,
        ?int $submissionId = null,
        ?array $details = null,
        string $status = 'success'
    ): void {
        $adminInfo = self::getCurrentAdminInfo();
        self::log($action, 'submission', 'contact_submission', $submissionId, $details, $status, $adminInfo['id'], $adminInfo['email']);
    }
    
    /**
     * Log settings changes
     */
    public static function logSettings(
        string $action,
        ?array $details = null,
        string $status = 'success'
    ): void {
        $adminInfo = self::getCurrentAdminInfo();
        self::log($action, 'settings', null, null, $details, $status, $adminInfo['id'], $adminInfo['email']);
    }
    
    /**
     * Get current admin info from session
     */
    private static function getCurrentAdminInfo(): array {
        try {
            $request = new Request();
            $token = $request->bearerToken();
            
            if (!$token) {
                return ['id' => null, 'email' => null];
            }
            
            $db = Database::getConnection();
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            $stmt = $db->prepare("
                SELECT au.id, au.email 
                FROM admin_sessions ass
                JOIN admin_users au ON ass.admin_user_id = au.id
                WHERE ass.session_token = ? 
                AND ass.ip_address = ?
                AND (ass.auth_step = 3 OR ass.step = 99)
                AND ass.expires_at > NOW()
            ");
            $stmt->execute([$token, $ip]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'id' => $result['id'] ?? null,
                'email' => $result['email'] ?? null
            ];
        } catch (Exception $e) {
            return ['id' => null, 'email' => null];
        }
    }
    
    /**
     * Get client IP address
     */
    private static function getClientIp(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // Handle comma-separated list (X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                return $ip;
            }
        }
        
        return 'unknown';
    }
    
    /**
     * Get user agent string
     */
    private static function getUserAgent(): string {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    }
    
    /**
     * Get activity logs with pagination and filtering
     */
    public static function getLogs(
        int $page = 1,
        int $perPage = 50,
        ?string $category = null,
        ?string $action = null,
        ?int $adminUserId = null,
        ?string $status = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): array {
        $db = Database::getConnection();
        $offset = ($page - 1) * $perPage;
        
        $where = [];
        $params = [];
        
        if ($category) {
            $where[] = 'aal.category = ?';
            $params[] = $category;
        }
        
        if ($action) {
            $where[] = 'aal.action LIKE ?';
            $params[] = "%$action%";
        }
        
        if ($adminUserId) {
            $where[] = 'aal.admin_user_id = ?';
            $params[] = $adminUserId;
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
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM admin_activity_logs aal $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get logs
        $params[] = $perPage;
        $params[] = $offset;
        $stmt = $db->prepare("
            SELECT aal.*, au.name as admin_name
            FROM admin_activity_logs aal
            LEFT JOIN admin_users au ON aal.admin_user_id = au.id
            $whereClause
            ORDER BY aal.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON details
        foreach ($logs as &$log) {
            if ($log['details']) {
                $log['details'] = json_decode($log['details'], true);
            }
        }
        
        return [
            'data' => $logs,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage)
        ];
    }
}
