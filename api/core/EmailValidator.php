<?php

/**
 * Email Validator
 * Comprehensive email validation including disposable domain detection,
 * role-based email blocking, and MX record verification.
 */
class EmailValidator {
    private static ?array $disposableDomains = null;
    private static ?array $rolePrefixes = null;
    
    /**
     * Validate email with all checks
     * @param string $email
     * @return array ['valid' => bool, 'error' => string|null]
     */
    public static function validate(string $email): array {
        // Step 1: Format validation
        $email = trim(strtolower($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['valid' => false, 'error' => 'Invalid email format'];
        }
        
        // Extract parts
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return ['valid' => false, 'error' => 'Invalid email format'];
        }
        
        $localPart = $parts[0];
        $domain = $parts[1];
        
        // Step 2: Disposable email detection
        if (self::isDisposableDomain($domain)) {
            error_log("Disposable email blocked: $email");
            return ['valid' => false, 'error' => 'Temporary email addresses are not allowed'];
        }
        
        // Step 3: Role-based email blocking
        if (self::isRoleBasedEmail($localPart)) {
            error_log("Role-based email blocked: $email");
            return ['valid' => false, 'error' => 'Generic role-based emails are not allowed for registration'];
        }
        
        // Step 4: MX record verification (only in production)
        if (!self::hasMxRecord($domain)) {
            error_log("No MX records for domain: $domain (email: $email)");
            return ['valid' => false, 'error' => 'Invalid email domain'];
        }
        
        return ['valid' => true, 'error' => null];
    }
    
    /**
     * Check if domain is in disposable list
     */
    public static function isDisposableDomain(string $domain): bool {
        $domain = strtolower(trim($domain));
        
        // Try DB first
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT 1 FROM blocked_email_domains WHERE domain = ? AND type = 'disposable' LIMIT 1");
            $stmt->execute([$domain]);
            if ($stmt->fetch()) {
                return true;
            }
        } catch (Exception $e) {
            // Fallback to JSON file
            error_log("EmailValidator DB error, using JSON fallback: " . $e->getMessage());
        }
        
        // Fallback: Load from JSON
        if (self::$disposableDomains === null) {
            $jsonPath = __DIR__ . '/../config/disposable_domains.json';
            if (file_exists($jsonPath)) {
                $content = file_get_contents($jsonPath);
                self::$disposableDomains = json_decode($content, true) ?? [];
            } else {
                self::$disposableDomains = [];
            }
        }
        
        return in_array($domain, self::$disposableDomains, true);
    }
    
    /**
     * Check if local part is a role-based email
     */
    public static function isRoleBasedEmail(string $localPart): bool {
        $localPart = strtolower(trim($localPart));
        
        // Try DB first
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT domain FROM blocked_email_domains WHERE type = 'role'");
            $stmt->execute();
            $rolePrefixes = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($rolePrefixes as $prefix) {
                if ($localPart === $prefix || str_starts_with($localPart, $prefix . '.') || str_starts_with($localPart, $prefix . '+')) {
                    return true;
                }
            }
        } catch (Exception $e) {
            // Fallback to hardcoded list
            error_log("EmailValidator role check DB error, using fallback: " . $e->getMessage());
        }
        
        // Fallback: Common role prefixes
        if (self::$rolePrefixes === null) {
            self::$rolePrefixes = [
                'admin', 'administrator', 'info', 'support', 'sales', 
                'contact', 'webmaster', 'postmaster', 'hostmaster',
                'noreply', 'no-reply', 'mailer-daemon', 'root',
                'abuse', 'security', 'help', 'billing', 'marketing',
                'team', 'hello', 'office', 'mail', 'email'
            ];
        }
        
        return in_array($localPart, self::$rolePrefixes, true);
    }
    
    /**
     * Verify domain has valid MX records
     */
    public static function hasMxRecord(string $domain): bool {
        // Skip in development/testing
        if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
            return true;
        }
        
        // Check for MX records
        if (checkdnsrr($domain, 'MX')) {
            return true;
        }
        
        // Fallback: Check for A record (some domains use A records for mail)
        if (checkdnsrr($domain, 'A')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Seed disposable domains from JSON to database
     */
    public static function seedDisposableDomains(): int {
        $jsonPath = __DIR__ . '/../config/disposable_domains.json';
        if (!file_exists($jsonPath)) {
            throw new Exception("Disposable domains JSON file not found");
        }
        
        $domains = json_decode(file_get_contents($jsonPath), true);
        if (!is_array($domains)) {
            throw new Exception("Invalid JSON format in disposable domains file");
        }
        
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT IGNORE INTO blocked_email_domains (domain, type) VALUES (?, 'disposable')");
        
        $count = 0;
        foreach ($domains as $domain) {
            $domain = strtolower(trim($domain));
            if (!empty($domain)) {
                $stmt->execute([$domain]);
                if ($stmt->rowCount() > 0) {
                    $count++;
                }
            }
        }
        
        return $count;
    }
}
