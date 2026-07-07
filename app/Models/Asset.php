<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'location',
        'remarks',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}