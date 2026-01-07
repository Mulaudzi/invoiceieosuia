<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'is_default',
        'styles',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'styles' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public static function getDefaultStyles(): array
    {
        return [
            'primaryColor' => '#1e3a5f',
            'accentColor' => '#f59e0b',
            'fontFamily' => 'Inter',
            'headerStyle' => 'left',
            'showLogo' => true,
            'showBorder' => true,
            'showWatermark' => false,
            'tableStyle' => 'striped',
        ];
    }
}
