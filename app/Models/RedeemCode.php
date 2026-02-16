<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RedeemCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'is_used',
        'device_id',
        'activated_at',
        'user_id',
        'creator_id',
        'document_id',
        'duration_type',
        'expires_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
