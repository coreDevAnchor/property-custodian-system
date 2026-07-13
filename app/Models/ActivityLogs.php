<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class ActivityLogs extends Model
{
    //public $timestamps = false;

    protected $fillable = [
        'asset_id',
        'action',
        'description',
        'actor_id',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Records are append-only — block any attempt to modify or remove history.
     */
    protected static function boot()
    {
        parent::boot();

        static::updating(function () {
            throw new \RuntimeException('Activity logs cannot be edited.');
        });

        static::deleting(function () {
            throw new \RuntimeException('Activity logs cannot be deleted.');
        });
    }

    /**
     * Convenience factory for recording an event against an asset.
     */
    public static function record(Asset $asset, string $action, string $description, array $metadata = []): self
    {
        return static::create([
            'asset_id' => $asset->id,
            'action' => $action,
            'description' => $description,
            'actor_id' => Auth::id(),
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
