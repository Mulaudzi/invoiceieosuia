<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'product_id',
        'name',
        'description',
        'quantity',
        'price',
        'tax_rate',
        'subtotal',
        'tax',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->subtotal = $item->quantity * $item->price;
            $item->tax = $item->subtotal * ($item->tax_rate / 100);
            $item->total = $item->subtotal + $item->tax;
        });

        static::saved(function ($item) {
            $item->invoice->recalculateTotals();
        });

        static::deleted(function ($item) {
            $item->invoice->recalculateTotals();
        });
    }
}
