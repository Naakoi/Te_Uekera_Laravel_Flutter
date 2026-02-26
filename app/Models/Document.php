<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'file_path',
        'thumbnail_path',
        'price',
        'published_at',
        'page_count',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function paymentCodes()
    {
        return $this->hasMany(PaymentCode::class);
    }
}
