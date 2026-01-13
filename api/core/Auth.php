<?php

class Auth {
    private static ?array $user = null;
    
    public static function user(): ?array {
        return self::formatUserForFrontend(self::$user);
    }
    
    /**
     * Format user data for frontend (snake_case to camelCase, add emailVerified boolean)
     */
    public static function formatUserForFrontend(?array $user): ?array {
        if ($user === null) return null;
        
        return [
            'id' => (string)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'plan' => $user['plan'] ?? 'free',
            'businessName' => $user['business_name'] ?? null,
            'phone' => $user['phone'] ?? null,
            'address' => $user['address'] ?? null,
            'taxNumber' => $user['tax_number'] ?? null,
            'avatar' => $user['avatar'] ?? null,
            'emailVerified' => !empty($user['email_verified_at']),
            'emailVerifiedAt' => $user['email_verified_at'] ?? null,
            'createdAt' => $user['created_at'] ?? null,
        ];
    }
    
    public static function id(): ?int {
        return self::$user['id'] ?? null;
    }
    
    /**
     * Alias for id() - for backwards compatibility
     */
    public static function getUserId(): ?int {
        return self::id();
    }
    
    public static function setUser(array $user): void {
        self::$user = $user;
    }
    
    /**
     * Set user ID directly (for cron jobs)
     */
    public static function setUserId(int $userId): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if ($user) {
            unset($user['password']);
            self::$user = $user;
        }
    }
    
    public static function check(): bool {
        return self::$user !== null;
    }
    
    public static function generateToken(int $userId): string {
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO api_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $hash, $expires]);
        
        return $token;
    }
    
    public static function validateToken(string $token): ?array {
        $hash = hash('sha256', $token);
        
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT u.* FROM users u
            JOIN api_tokens t ON u.id = t.user_id
            WHERE t.token = ? AND t.expires_at > NOW()
        ");
        $stmt->execute([$hash]);
        $user = $stmt->fetch();
        
        if ($user) {
            unset($user['password']);
            return $user;
        }
        
        return null;
    }
    
    public static function revokeToken(string $token): void {
        $hash = hash('sha256', $token);
        
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM api_tokens WHERE token = ?");
        $stmt->execute([$hash]);
    }
}
