<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'document_id',
        'is_used',
        'generated_by',
        'used_by',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function purchase()
    {
        return $this->hasOne(Purchase::class);
    }
}
