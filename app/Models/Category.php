<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    public const UNIT_SINGLE = 'single';
    public const UNIT_MULTI = 'multi';

    public const POLICY_RETURNABLE = 'returnable';
    public const POLICY_CONSUMABLE = 'consumable';

    protected $fillable = [
        'name',
        'prefix',
        'description',
        'unit_type',
        'borrow_policy',
    ];

    protected $casts = [
        'borrow_policy' => 'string',
    ];

    public function isConsumable(): bool
    {
        return $this->borrow_policy === self::POLICY_CONSUMABLE;
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
    
    public function assetTypes(): HasMany
    {
        return $this->hasMany(AssetType::class);
    }
}