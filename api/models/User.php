<?php

class User extends Model {
    protected static string $table = 'users';
    protected static array $fillable = [
        'name', 'email', 'password', 'plan', 'google_id',
        'business_name', 'phone', 'address', 'tax_number', 'status',
        'avatar', 'logo', 'logo_path', 'email_verified_at',
        'email_credits', 'email_credits_used', 'sms_credits', 'sms_credits_used',
        'credits_reset_at', 'reminder_settings', 'subscription_renewal_date',
        'subscription_grace_until', 'payment_failure_count', 'last_payment_failure_at'
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
