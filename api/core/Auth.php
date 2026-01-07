<?php

class Auth {
    private static ?array $user = null;
    
    public static function user(): ?array {
        return self::$user;
    }
    
    public static function id(): ?int {
        return self::$user['id'] ?? null;
    }
    
    public static function setUser(array $user): void {
        self::$user = $user;
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
