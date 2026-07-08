<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Asset extends Model
{
    protected $fillable = [
        'asset_tag',
        'name',
        'description',
        'category_id',
        'serial_number',
        'acquisition_date',
        'acquisition_cost',
        'depreciation_rate',
        'condition',
        'status',
        'photo',
        'location_id',
        'remarks',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function borrows(): HasMany
    {
        return $this->hasMany(BorrowRequest::class);
    }

    public function currentBorrow(): HasOne
    {
        return $this->hasOne(BorrowRequest::class)
            ->where('status', 'borrowed')
            ->latestOfMany();
    }
}