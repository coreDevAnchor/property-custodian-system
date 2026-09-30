<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $name
 * @property 'available'|'borrowed'|'under_repair'|'disposed'|'lost' $status
 *
 * @method static Asset|null find(int|string $id, array<int, string> $columns = ['*'])
 * @method static Asset findOrFail(int|string $id, array<int, string> $columns = ['*'])
 */
class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_tag',
        'name',
        'description',
        'category_id',
        'asset_type_id',
        'serial_number',
        'acquisition_date',
        'acquisition_cost',
        'depreciation_rate',
        'condition',
        'status',
        'photo',
        'location_id',
        'remarks',
        'amount',
        'original_amount',
        'low_stock_notified_at',
    ];

    protected $casts = [
        'low_stock_notified_at' => 'datetime',
        'original_amount' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Asset $asset) {
            if ($asset->original_amount === null) {
                $asset->original_amount = $asset->amount ?? 1;
            }
        });
    }

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

    public function assetType(): BelongsTo
    {
        return $this->belongsTo(AssetType::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLogs::class)->latest('created_at');
    }
}
