<?php

namespace App\Support;

use App\Models\Asset;
use App\Models\Category;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Database\Eloquent\Builder;

class LowStockChecker
{
    private const THRESHOLD = 5;

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

        if ($remaining > self::THRESHOLD) {
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
