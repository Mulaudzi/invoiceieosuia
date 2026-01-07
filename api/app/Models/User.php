<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'plan',
        'business_name',
        'phone',
        'address',
        'tax_number',
        'logo',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function templates()
    {
        return $this->hasMany(Template::class);
    }

    // Plan limits
    public function getInvoiceLimitAttribute(): ?int
    {
        return match ($this->plan) {
            'free' => 30,
            'pro' => null, // unlimited
            'business' => null, // unlimited
            default => 30,
        };
    }

    public function getTemplateLimitAttribute(): int
    {
        return match ($this->plan) {
            'free' => 3,
            'pro' => 10,
            'business' => 999,
            default => 3,
        };
    }

    public function canCreateInvoice(): bool
    {
        if ($this->invoice_limit === null) return true;
        
        $monthlyCount = $this->invoices()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
            
        return $monthlyCount < $this->invoice_limit;
    }
}
