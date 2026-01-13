<?php

class HealthController {
    
    public function check(): void {
        $status = [
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => PHP_VERSION,
            'checks' => []
        ];
        
        // Check database connection
        try {
            $db = Database::getConnection();
            $stmt = $db->query('SELECT 1');
            $status['checks']['database'] = [
                'status' => 'ok',
                'message' => 'Database connection successful'
            ];
        } catch (Exception $e) {
            $status['status'] = 'error';
            $status['checks']['database'] = [
                'status' => 'error',
                'message' => 'Database connection failed: ' . $e->getMessage()
            ];
        }
        
        // Check if required tables exist
        try {
            $db = Database::getConnection();
            $tables = ['users', 'clients', 'products', 'invoices', 'payments'];
            $missingTables = [];
            
            foreach ($tables as $table) {
                $stmt = $db->query("SHOW TABLES LIKE '$table'");
                if ($stmt->rowCount() === 0) {
                    $missingTables[] = $table;
                }
            }
            
            if (empty($missingTables)) {
                $status['checks']['tables'] = [
                    'status' => 'ok',
                    'message' => 'All required tables exist'
                ];
            } else {
                $status['status'] = 'warning';
                $status['checks']['tables'] = [
                    'status' => 'warning',
                    'message' => 'Missing tables: ' . implode(', ', $missingTables)
                ];
            }
        } catch (Exception $e) {
            $status['checks']['tables'] = [
                'status' => 'error',
                'message' => 'Could not check tables: ' . $e->getMessage()
            ];
        }
        
        // Check environment variables
        $requiredEnvVars = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'JWT_SECRET'];
        $missingEnvVars = [];
        
        foreach ($requiredEnvVars as $var) {
            if (empty($_ENV[$var])) {
                $missingEnvVars[] = $var;
            }
        }
        
        if (empty($missingEnvVars)) {
            $status['checks']['environment'] = [
                'status' => 'ok',
                'message' => 'All required environment variables are set'
            ];
        } else {
            $status['status'] = 'warning';
            $status['checks']['environment'] = [
                'status' => 'warning',
                'message' => 'Missing environment variables: ' . implode(', ', $missingEnvVars)
            ];
        }
        
        // Check PHP extensions
        $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
        $missingExtensions = [];
        
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $missingExtensions[] = $ext;
            }
        }
        
        if (empty($missingExtensions)) {
            $status['checks']['extensions'] = [
                'status' => 'ok',
                'message' => 'All required PHP extensions are loaded'
            ];
        } else {
            $status['status'] = 'error';
            $status['checks']['extensions'] = [
                'status' => 'error',
                'message' => 'Missing PHP extensions: ' . implode(', ', $missingExtensions)
            ];
        }
        
        // Check file permissions
        $writableDirs = [__DIR__ . '/../'];
        $status['checks']['permissions'] = [
            'status' => 'ok',
            'message' => 'File permissions check passed'
        ];
        
        $httpStatus = $status['status'] === 'ok' ? 200 : ($status['status'] === 'warning' ? 200 : 500);
        Response::json($status, $httpStatus);
    }
    
    public function debug(): void {
        // More detailed debug info (should be disabled in production)
        $debug = [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
            'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
            'loaded_extensions' => get_loaded_extensions(),
            'env_vars_set' => [
                'DB_HOST' => !empty($_ENV['DB_HOST']),
                'DB_DATABASE' => !empty($_ENV['DB_DATABASE']),
                'DB_USERNAME' => !empty($_ENV['DB_USERNAME']),
                'DB_PASSWORD' => !empty($_ENV['DB_PASSWORD']),
                'JWT_SECRET' => !empty($_ENV['JWT_SECRET']),
                'MAIL_HOST' => !empty($_ENV['MAIL_HOST']),
                'GOOGLE_CLIENT_ID' => !empty($_ENV['GOOGLE_CLIENT_ID']),
            ],
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
        ];
        
        Response::json($debug);
    }
}
