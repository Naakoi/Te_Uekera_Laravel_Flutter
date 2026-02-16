<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentGatewaySetting extends Model
{
    protected $fillable = [
        'gateway',
        'config',
        'is_enabled',
    ];

    protected $casts = [
        'config' => 'encrypted:json',
        'is_enabled' => 'boolean',
    ];
}
