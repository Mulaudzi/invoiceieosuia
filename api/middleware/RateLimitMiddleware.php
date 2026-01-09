<?php

class RateLimitMiddleware {
    private int $maxAttempts;
    private int $decayMinutes;
    private string $key;
    
    public function __construct(int $maxAttempts = 5, int $decayMinutes = 15) {
        $this->maxAttempts = $maxAttempts;
        $this->decayMinutes = $decayMinutes;
    }
    
    public function handle(?string $key = null): bool {
        $this->key = $key ?? $this->getClientIdentifier();
        
        $this->cleanupExpired();
        
        $attempts = $this->getAttempts();
        
        if ($attempts >= $this->maxAttempts) {
            $retryAfter = $this->getRetryAfter();
            Response::error(
                "Too many attempts. Please try again in {$retryAfter} minutes.",
                429,
                ['Retry-After' => $retryAfter * 60]
            );
            return false;
        }
        
        return true;
    }
    
    public function hit(): void {
        $db = Database::getConnection();
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$this->decayMinutes} minutes"));
        
        $stmt = $db->prepare("
            INSERT INTO rate_limits (`key`, attempts, expires_at) 
            VALUES (?, 1, ?)
            ON DUPLICATE KEY UPDATE 
                attempts = attempts + 1,
                expires_at = IF(expires_at < NOW(), ?, expires_at)
        ");
        $stmt->execute([$this->key, $expiresAt, $expiresAt]);
    }
    
    public function clear(): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM rate_limits WHERE `key` = ?");
        $stmt->execute([$this->key]);
    }
    
    private function getAttempts(): int {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT attempts FROM rate_limits 
            WHERE `key` = ? AND expires_at > NOW()
        ");
        $stmt->execute([$this->key]);
        $result = $stmt->fetch();
        
        return $result ? (int)$result['attempts'] : 0;
    }
    
    private function getRetryAfter(): int {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes 
            FROM rate_limits 
            WHERE `key` = ? AND expires_at > NOW()
        ");
        $stmt->execute([$this->key]);
        $result = $stmt->fetch();
        
        return $result ? max(1, (int)$result['minutes']) : $this->decayMinutes;
    }
    
    private function cleanupExpired(): void {
        $db = Database::getConnection();
        $db->exec("DELETE FROM rate_limits WHERE expires_at < NOW()");
    }
    
    private function getClientIdentifier(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        return 'ip:' . $ip;
    }
}
