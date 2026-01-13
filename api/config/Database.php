<?php

class Database {
    private static ?PDO $connection = null;
    private static ?Database $instance = null;
    
    private function __construct() {}
    
    public static function getConnection(): PDO {
        if (self::$connection === null) {
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $db = $_ENV['DB_DATABASE'] ?? 'ejetffbz_invoices';
            $user = $_ENV['DB_USERNAME'] ?? 'ejetffbz_ieosuia';
            $pass = $_ENV['DB_PASSWORD'] ?? 'I Am Ieosuia';
            $charset = 'utf8mb4';
            
            $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            try {
                self::$connection = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                throw new Exception('Database connection failed: ' . $e->getMessage());
            }
        }
        
        return self::$connection;
    }
    
    /**
     * Get singleton instance of Database wrapper
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    /**
     * Execute a query and return all results
     */
    public function fetchAll(string $sql, array $params = []): array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Execute a query and return single result
     */
    public function fetch(string $sql, array $params = []): ?array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Execute a query (INSERT, UPDATE, DELETE)
     */
    public function query(string $sql, array $params = []): bool {
        $stmt = self::getConnection()->prepare($sql);
        return $stmt->execute($params);
    }
    
    /**
     * Get last insert ID
     */
    public function lastInsertId(): string {
        return self::getConnection()->lastInsertId();
    }
}
