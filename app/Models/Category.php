<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    public const UNIT_SINGLE = 'single';
    public const UNIT_MULTI = 'multi';

    protected $fillable = [
        'name',
        'prefix',
        'description',
        'unit_type',
    ];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
    
    public function assetTypes(): HasMany
    {
        return $this->hasMany(AssetType::class);
    }
}