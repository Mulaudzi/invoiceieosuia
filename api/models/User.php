<?php

class User extends Model {
    protected static string $table = 'users';
    protected static array $fillable = [
        'name', 'email', 'password', 'plan', 
        'business_name', 'phone', 'address', 'tax_number', 'status'
    ];
    
    public function findByEmail(string $email): ?array {
        return $this->where('email', $email)->first();
    }
    
    public function getInvoiceLimit(?string $plan): ?int {
        return match ($plan ?? 'free') {
            'free' => 30,
            'pro', 'business' => null,
            default => 30,
        };
    }
    
    public function canCreateInvoice(int $userId, string $plan): bool {
        $limit = $this->getInvoiceLimit($plan);
        if ($limit === null) return true;
        
        $count = Invoice::query()
            ->where('user_id', $userId)
            ->count();
        
        // Simple monthly check - you could enhance this
        return $count < $limit;
    }
}
