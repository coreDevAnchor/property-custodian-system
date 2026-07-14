<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property-read User $user
 */
class Employee extends Model
{
    protected $fillable = [
        'user_id',
        'department',
        'employee_id',
        'contact',
        'is_active',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function borrows(): HasMany
    {
        return $this->hasMany(BorrowRequest::class)
            ->latest('requested_at');
    }
}
