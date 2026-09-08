<?php

class User extends Model {
    protected static string $table = 'users';
    protected static array $fillable = [
        'name', 'email', 'password', 'plan', 'google_id',
        'business_name', 'phone', 'address', 'tax_number', 'status',
        'avatar', 'logo', 'logo_path', 'email_verified_at', 'registration_number', 'website',
        'bank_name', 'account_name', 'account_number', 'branch_code', 'swift_code', 'payment_instructions'
    ];
    
    public function findByEmail(string $email): ?array {
        return $this->where('email', $email)->first();
    }
    
    public function getInvoiceLimit(?string $plan): ?int {
        return null;
    }
    
    public function canCreateInvoice(int $userId, string $plan): bool {
        return true;
    }
}
