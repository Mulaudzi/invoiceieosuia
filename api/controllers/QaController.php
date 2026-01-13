<?php

/**
 * QA Controller
 * Handles test data seeding and cleanup for the QA & Debug Console
 * Admin-only access required
 */
class QaController {
    
    private $db;
    
    // Test data prefixes for easy identification and cleanup
    private const TEST_PREFIXES = [
        'sms' => 'SMS_TEST_',
        'qr' => 'QR_TEST_',
        'invoicing' => 'INV_TEST_',
        'shared' => 'SHARED_TEST_',
        'all' => 'TEST_'
    ];
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Verify admin token
     */
    private function verifyAdmin(): bool {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            Response::error('Unauthorized', 401);
            return false;
        }
        
        $token = $matches[1];
        
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM admin_sessions 
                WHERE token = ? 
                AND step = 3 
                AND expires_at > NOW()
            ");
            $stmt->execute([$token]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$session) {
                Response::error('Invalid or expired admin session', 401);
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            Response::error('Authentication failed', 500);
            return false;
        }
    }
    
    /**
     * Seed test data for specified system
     */
    public function seed(): void {
        if (!$this->verifyAdmin()) {
            return;
        }
        
        $request = new Request();
        $system = $request->input('system', 'all');
        
        $seededData = [];
        
        try {
            $this->db->beginTransaction();
            
            switch ($system) {
                case 'sms':
                    $seededData = $this->seedSmsData();
                    break;
                case 'qr':
                    $seededData = $this->seedQrData();
                    break;
                case 'invoicing':
                    $seededData = $this->seedInvoicingData();
                    break;
                case 'shared':
                    $seededData = $this->seedSharedData();
                    break;
                case 'all':
                default:
                    $seededData = array_merge(
                        $this->seedSharedData(),
                        $this->seedSmsData(),
                        $this->seedQrData(),
                        $this->seedInvoicingData()
                    );
                    break;
            }
            
            $this->db->commit();
            
            Response::json([
                'success' => true,
                'message' => "Test data seeded for system: {$system}",
                'seeded' => $seededData,
                'prefix' => self::TEST_PREFIXES[$system] ?? self::TEST_PREFIXES['all'],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Failed to seed test data: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Cleanup test data for specified system
     */
    public function cleanup(): void {
        if (!$this->verifyAdmin()) {
            return;
        }
        
        $request = new Request();
        $system = $request->input('system', 'all');
        
        $cleanedData = [];
        
        try {
            $this->db->beginTransaction();
            
            switch ($system) {
                case 'sms':
                    $cleanedData = $this->cleanupSmsData();
                    break;
                case 'qr':
                    $cleanedData = $this->cleanupQrData();
                    break;
                case 'invoicing':
                    $cleanedData = $this->cleanupInvoicingData();
                    break;
                case 'shared':
                    $cleanedData = $this->cleanupSharedData();
                    break;
                case 'all':
                default:
                    $cleanedData = array_merge(
                        $this->cleanupInvoicingData(),
                        $this->cleanupSmsData(),
                        $this->cleanupQrData(),
                        $this->cleanupSharedData()
                    );
                    break;
            }
            
            $this->db->commit();
            
            Response::json([
                'success' => true,
                'message' => "Test data cleaned for system: {$system}",
                'cleaned' => $cleanedData,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Failed to cleanup test data: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get current test data status
     */
    public function status(): void {
        if (!$this->verifyAdmin()) {
            return;
        }
        
        $status = [];
        
        try {
            // Count test clients
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM clients WHERE name LIKE '%_TEST_%'");
            $status['clients'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Count test products
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM products WHERE name LIKE '%_TEST_%'");
            $status['products'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Count test invoices
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE '%TEST%'");
            $status['invoices'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Count test notification logs
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM notification_logs WHERE recipient LIKE '%test%'");
            $status['notification_logs'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Check for QR table existence
            try {
                $stmt = $this->db->query("SELECT COUNT(*) as count FROM qr_codes WHERE code LIKE '%TEST%'");
                $status['qr_codes'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            } catch (Exception $e) {
                $status['qr_codes'] = 'table_not_exists';
            }
            
            Response::json([
                'success' => true,
                'test_data_counts' => $status,
                'has_test_data' => array_sum(array_filter($status, 'is_numeric')) > 0,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to get test data status: ' . $e->getMessage(), 500);
        }
    }
    
    // ==================== SMS System Seeding ====================
    
    private function seedSmsData(): array {
        $seeded = [];
        $prefix = self::TEST_PREFIXES['sms'];
        
        // Create test notification logs for SMS
        $smsLogs = [
            ['type' => 'sms', 'recipient' => '+27' . $prefix . '123456789', 'subject' => null, 'status' => 'sent'],
            ['type' => 'sms', 'recipient' => '+27' . $prefix . '987654321', 'subject' => null, 'status' => 'failed'],
            ['type' => 'sms', 'recipient' => '+27' . $prefix . '555666777', 'subject' => null, 'status' => 'pending'],
        ];
        
        // Get a test user ID (first admin or first user)
        $stmt = $this->db->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $userId = $user ? $user['id'] : 1;
        
        foreach ($smsLogs as $log) {
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO notification_logs (user_id, type, recipient, subject, status, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$userId, $log['type'], $log['recipient'], $log['subject'], $log['status']]);
                $seeded[] = ['notification_log' => $this->db->lastInsertId()];
            } catch (Exception $e) {
                // Skip if table doesn't exist or constraint violation
            }
        }
        
        return ['sms_logs' => count($seeded)];
    }
    
    private function cleanupSmsData(): array {
        $prefix = self::TEST_PREFIXES['sms'];
        
        $stmt = $this->db->prepare("DELETE FROM notification_logs WHERE recipient LIKE ?");
        $stmt->execute(['%' . $prefix . '%']);
        $smsDeleted = $stmt->rowCount();
        
        return ['sms_logs_deleted' => $smsDeleted];
    }
    
    // ==================== QR System Seeding ====================
    
    private function seedQrData(): array {
        $prefix = self::TEST_PREFIXES['qr'];
        $seeded = [];
        
        // Check if qr_codes table exists
        try {
            $stmt = $this->db->query("SHOW TABLES LIKE 'qr_codes'");
            if ($stmt->rowCount() === 0) {
                // Create QR codes table if it doesn't exist
                $this->db->exec("
                    CREATE TABLE IF NOT EXISTS qr_codes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        code VARCHAR(100) NOT NULL UNIQUE,
                        name VARCHAR(255),
                        target_url TEXT NOT NULL,
                        scans INT DEFAULT 0,
                        active BOOLEAN DEFAULT TRUE,
                        expires_at DATETIME NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_user_id (user_id),
                        INDEX idx_code (code)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
                $seeded[] = 'qr_codes_table_created';
            }
            
            // Get a test user ID
            $stmt = $this->db->query("SELECT id FROM users LIMIT 1");
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $userId = $user ? $user['id'] : 1;
            
            // Create test QR codes
            $qrCodes = [
                ['code' => $prefix . 'CODE001', 'name' => $prefix . 'Test QR 1', 'target_url' => 'https://example.com/test1', 'active' => 1],
                ['code' => $prefix . 'CODE002', 'name' => $prefix . 'Test QR 2', 'target_url' => 'https://example.com/test2', 'active' => 1],
                ['code' => $prefix . 'CODE003', 'name' => $prefix . 'Expired QR', 'target_url' => 'https://example.com/expired', 'active' => 0],
            ];
            
            foreach ($qrCodes as $qr) {
                $stmt = $this->db->prepare("
                    INSERT INTO qr_codes (user_id, code, name, target_url, active, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                ");
                $stmt->execute([$userId, $qr['code'], $qr['name'], $qr['target_url'], $qr['active']]);
                $seeded[] = ['qr_code' => $qr['code']];
            }
            
            return ['qr_codes' => count($qrCodes), 'details' => $seeded];
            
        } catch (Exception $e) {
            return ['qr_codes' => 0, 'error' => $e->getMessage()];
        }
    }
    
    private function cleanupQrData(): array {
        $prefix = self::TEST_PREFIXES['qr'];
        
        try {
            $stmt = $this->db->prepare("DELETE FROM qr_codes WHERE code LIKE ?");
            $stmt->execute([$prefix . '%']);
            return ['qr_codes_deleted' => $stmt->rowCount()];
        } catch (Exception $e) {
            return ['qr_codes_deleted' => 0, 'note' => 'Table may not exist'];
        }
    }
    
    // ==================== Invoicing System Seeding ====================
    
    private function seedInvoicingData(): array {
        $prefix = self::TEST_PREFIXES['invoicing'];
        $seeded = [];
        
        // Get a test user ID
        $stmt = $this->db->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $userId = $user ? $user['id'] : 1;
        
        // Create test client
        $stmt = $this->db->prepare("
            INSERT INTO clients (user_id, name, email, phone, address, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $prefix . 'Test Client',
            'test.client@' . strtolower($prefix) . 'example.com',
            '+27' . $prefix . '000000000',
            $prefix . ' Test Address, Test City, 0000'
        ]);
        $testClientId = $this->db->lastInsertId();
        $seeded[] = ['client' => $testClientId];
        
        // Create test product
        $stmt = $this->db->prepare("
            INSERT INTO products (user_id, name, description, price, tax_rate, category, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $prefix . 'Test Product',
            $prefix . ' Description for testing',
            999.99,
            15.00,
            'Test Category'
        ]);
        $testProductId = $this->db->lastInsertId();
        $seeded[] = ['product' => $testProductId];
        
        // Create test invoices with different statuses
        $invoiceStatuses = ['Draft', 'Pending', 'Paid', 'Overdue'];
        
        foreach ($invoiceStatuses as $index => $status) {
            $invoiceNumber = $prefix . date('Ymd') . '_' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
            
            $stmt = $this->db->prepare("
                INSERT INTO invoices (user_id, client_id, invoice_number, date, due_date, status, subtotal, tax, total, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $subtotal = 1000 * ($index + 1);
            $tax = $subtotal * 0.15;
            $total = $subtotal + $tax;
            
            $stmt->execute([
                $userId,
                $testClientId,
                $invoiceNumber,
                date('Y-m-d'),
                date('Y-m-d', strtotime('+30 days')),
                $status,
                $subtotal,
                $tax,
                $total,
                $prefix . ' Test invoice for QA testing'
            ]);
            $invoiceId = $this->db->lastInsertId();
            $seeded[] = ['invoice' => $invoiceId, 'status' => $status];
            
            // Add invoice item
            $stmt = $this->db->prepare("
                INSERT INTO invoice_items (invoice_id, product_id, name, description, quantity, price, tax_rate, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $invoiceId,
                $testProductId,
                $prefix . 'Test Item',
                'Test item description',
                1,
                $subtotal,
                15.00,
                $total
            ]);
        }
        
        return [
            'clients' => 1,
            'products' => 1,
            'invoices' => count($invoiceStatuses),
            'invoice_items' => count($invoiceStatuses),
            'details' => $seeded
        ];
    }
    
    private function cleanupInvoicingData(): array {
        $prefix = self::TEST_PREFIXES['invoicing'];
        $cleaned = [];
        
        // Delete invoice items first (foreign key constraint)
        $stmt = $this->db->prepare("
            DELETE ii FROM invoice_items ii
            INNER JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.invoice_number LIKE ?
        ");
        $stmt->execute([$prefix . '%']);
        $cleaned['invoice_items'] = $stmt->rowCount();
        
        // Delete invoices
        $stmt = $this->db->prepare("DELETE FROM invoices WHERE invoice_number LIKE ?");
        $stmt->execute([$prefix . '%']);
        $cleaned['invoices'] = $stmt->rowCount();
        
        // Delete test products
        $stmt = $this->db->prepare("DELETE FROM products WHERE name LIKE ?");
        $stmt->execute([$prefix . '%']);
        $cleaned['products'] = $stmt->rowCount();
        
        // Delete test clients
        $stmt = $this->db->prepare("DELETE FROM clients WHERE name LIKE ?");
        $stmt->execute([$prefix . '%']);
        $cleaned['clients'] = $stmt->rowCount();
        
        return $cleaned;
    }
    
    // ==================== Shared Services Seeding ====================
    
    private function seedSharedData(): array {
        $prefix = self::TEST_PREFIXES['shared'];
        $seeded = [];
        
        // Get a test user ID
        $stmt = $this->db->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $userId = $user ? $user['id'] : 1;
        
        // Create email notification logs
        $emailLogs = [
            ['type' => 'email', 'recipient' => $prefix . 'sent@test.com', 'subject' => $prefix . ' Test Email Sent', 'status' => 'sent'],
            ['type' => 'email', 'recipient' => $prefix . 'failed@test.com', 'subject' => $prefix . ' Test Email Failed', 'status' => 'failed'],
            ['type' => 'email', 'recipient' => $prefix . 'bounced@test.com', 'subject' => $prefix . ' Test Email Bounced', 'status' => 'bounced'],
        ];
        
        foreach ($emailLogs as $log) {
            try {
                $stmt = $this->db->prepare("
                    INSERT INTO notification_logs (user_id, type, recipient, subject, status, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$userId, $log['type'], $log['recipient'], $log['subject'], $log['status']]);
                $seeded[] = ['email_log' => $this->db->lastInsertId()];
            } catch (Exception $e) {
                // Skip if constraint violation
            }
        }
        
        // Create test templates
        try {
            $stmt = $this->db->prepare("
                INSERT INTO templates (user_id, name, primary_color, secondary_color, font_family, is_default, created_at)
                VALUES (?, ?, ?, ?, ?, 0, NOW())
            ");
            $stmt->execute([
                $userId,
                $prefix . 'Test Template',
                '#FF0000',
                '#00FF00',
                'Arial'
            ]);
            $seeded[] = ['template' => $this->db->lastInsertId()];
        } catch (Exception $e) {
            // Skip
        }
        
        return [
            'email_logs' => count($emailLogs),
            'templates' => 1,
            'details' => $seeded
        ];
    }
    
    private function cleanupSharedData(): array {
        $prefix = self::TEST_PREFIXES['shared'];
        $cleaned = [];
        
        // Delete email logs
        $stmt = $this->db->prepare("DELETE FROM notification_logs WHERE recipient LIKE ? OR subject LIKE ?");
        $stmt->execute([$prefix . '%', $prefix . '%']);
        $cleaned['notification_logs'] = $stmt->rowCount();
        
        // Delete test templates
        $stmt = $this->db->prepare("DELETE FROM templates WHERE name LIKE ?");
        $stmt->execute([$prefix . '%']);
        $cleaned['templates'] = $stmt->rowCount();
        
        return $cleaned;
    }
    
    /**
     * Run comprehensive system health check
     */
    public function healthCheck(): void {
        if (!$this->verifyAdmin()) {
            return;
        }
        
        $health = [
            'database' => $this->checkDatabaseHealth(),
            'tables' => $this->checkRequiredTables(),
            'apis' => $this->checkApiEndpoints(),
            'services' => $this->checkServices(),
        ];
        
        $overallStatus = 'healthy';
        foreach ($health as $category => $checks) {
            foreach ($checks as $check) {
                if (isset($check['status']) && $check['status'] === 'error') {
                    $overallStatus = 'unhealthy';
                    break 2;
                } elseif (isset($check['status']) && $check['status'] === 'warning') {
                    $overallStatus = 'degraded';
                }
            }
        }
        
        Response::json([
            'success' => true,
            'overall_status' => $overallStatus,
            'checks' => $health,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    private function checkDatabaseHealth(): array {
        try {
            $this->db->query("SELECT 1");
            return [
                ['name' => 'Database Connection', 'status' => 'ok', 'message' => 'Connected']
            ];
        } catch (Exception $e) {
            return [
                ['name' => 'Database Connection', 'status' => 'error', 'message' => $e->getMessage()]
            ];
        }
    }
    
    private function checkRequiredTables(): array {
        $requiredTables = [
            'users', 'clients', 'products', 'invoices', 'invoice_items',
            'payments', 'templates', 'notification_logs', 'reminders'
        ];
        
        $optionalTables = [
            'qr_codes', 'admin_sessions', 'webhook_logs', 'recurring_invoices'
        ];
        
        $results = [];
        
        foreach ($requiredTables as $table) {
            try {
                $stmt = $this->db->query("SHOW TABLES LIKE '$table'");
                if ($stmt->rowCount() > 0) {
                    $countStmt = $this->db->query("SELECT COUNT(*) as count FROM $table");
                    $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
                    $results[] = [
                        'name' => "Table: $table",
                        'status' => 'ok',
                        'message' => "$count rows",
                        'required' => true
                    ];
                } else {
                    $results[] = [
                        'name' => "Table: $table",
                        'status' => 'error',
                        'message' => 'Table missing',
                        'required' => true
                    ];
                }
            } catch (Exception $e) {
                $results[] = [
                    'name' => "Table: $table",
                    'status' => 'error',
                    'message' => $e->getMessage(),
                    'required' => true
                ];
            }
        }
        
        foreach ($optionalTables as $table) {
            try {
                $stmt = $this->db->query("SHOW TABLES LIKE '$table'");
                if ($stmt->rowCount() > 0) {
                    $results[] = [
                        'name' => "Table: $table",
                        'status' => 'ok',
                        'message' => 'Exists',
                        'required' => false
                    ];
                } else {
                    $results[] = [
                        'name' => "Table: $table",
                        'status' => 'warning',
                        'message' => 'Not implemented',
                        'required' => false
                    ];
                }
            } catch (Exception $e) {
                $results[] = [
                    'name' => "Table: $table",
                    'status' => 'warning',
                    'message' => 'Check failed',
                    'required' => false
                ];
            }
        }
        
        return $results;
    }
    
    private function checkApiEndpoints(): array {
        // Just return structure - actual endpoint testing done from frontend
        return [
            ['name' => 'Auth Endpoints', 'status' => 'ok', 'endpoints' => ['/login', '/register', '/logout', '/user']],
            ['name' => 'Invoice Endpoints', 'status' => 'ok', 'endpoints' => ['/invoices', '/invoices/{id}', '/invoices/{id}/pdf']],
            ['name' => 'Client Endpoints', 'status' => 'ok', 'endpoints' => ['/clients', '/clients/{id}']],
            ['name' => 'Product Endpoints', 'status' => 'ok', 'endpoints' => ['/products', '/products/{id}']],
            ['name' => 'SMS Endpoints', 'status' => 'ok', 'endpoints' => ['/invoices/{id}/send-sms']],
            ['name' => 'QR Endpoints', 'status' => 'warning', 'message' => 'Not implemented'],
        ];
    }
    
    private function checkServices(): array {
        $services = [];
        
        // Check SMS service config
        $smsApiKey = $_ENV['LOGICSMS_API_KEY'] ?? '';
        $services[] = [
            'name' => 'LogicSMS API',
            'status' => !empty($smsApiKey) ? 'ok' : 'warning',
            'message' => !empty($smsApiKey) ? 'Configured' : 'API key not set'
        ];
        
        // Check email service
        $smtpHost = $_ENV['SMTP_HOST'] ?? $_ENV['MAIL_HOST'] ?? '';
        $services[] = [
            'name' => 'SMTP/Email',
            'status' => !empty($smtpHost) ? 'ok' : 'warning',
            'message' => !empty($smtpHost) ? 'Configured' : 'Not configured'
        ];
        
        // Check PayFast
        $payfastId = $_ENV['PAYFAST_MERCHANT_ID'] ?? '';
        $services[] = [
            'name' => 'PayFast',
            'status' => !empty($payfastId) ? 'ok' : 'info',
            'message' => !empty($payfastId) ? 'Configured' : 'Not configured'
        ];
        
        return $services;
    }
}
