<?php

namespace App\Support;

use App\Models\Asset;
use App\Models\Category;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Database\Eloquent\Builder;

class LowStockChecker
{
    public static function check(?Asset $asset = null): int
    {
        if ($asset !== null) {
            return self::checkAsset($asset) ? 1 : 0;
        }

        return self::checkAll();
    }

    public static function checkAll(): int
    {
        $assets = Asset::with('category')
            ->whereHas('category', fn (Builder $query) => $query->where('unit_type', Category::UNIT_MULTI))
            ->get();

        $alerted = 0;

        foreach ($assets as $asset) {
            if (self::checkAsset($asset)) {
                $alerted++;
            }
        }

        return $alerted;
    }

    private static function checkAsset(Asset $asset): bool
    {
        if ($asset->category?->unit_type !== Category::UNIT_MULTI) {
            return false;
        }

        $remaining = (int) $asset->amount;
        $total = (int) ($asset->original_amount ?? $asset->amount ?? 1);
        $threshold = max(1, (int) ceil($total * 0.20));

        if ($remaining > $threshold) {
            if ($asset->low_stock_notified_at !== null) {
                $asset->update(['low_stock_notified_at' => null]);
            }

            return false;
        }

        if ($asset->low_stock_notified_at !== null) {
            return false;
        }

        $custodians = User::where('role', 'custodian')->get();

        foreach ($custodians as $custodian) {
            $custodian->notify(new LowStockNotification($asset, $remaining));
        }

        $asset->update(['low_stock_notified_at' => now()]);

        return true;
    }
}
