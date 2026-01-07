<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'company',
        'address',
        'tax_number',
        'status',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function getTotalRevenueAttribute(): float
    {
        return $this->invoices()
            ->where('status', 'Paid')
            ->sum('total');
    }

    public function getInvoiceCountAttribute(): int
    {
        return $this->invoices()->count();
    }
}
