<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class SendLowStockAlerts extends Command
{
    protected $signature = 'inventory:send-low-stock';

    protected $description = 'Notify custodians when multi-unit assets are running low on stock';

    public function handle(): int
    {
        $assets = Asset::with('category')
            ->whereHas('category', fn (Builder $query) => $query->where('unit_type', Category::UNIT_MULTI))
            ->get();
        $sent = 0;

        foreach ($assets as $asset) {
            if (($asset->amount ?? 1) <= 1) {
                continue;
            }

            $activeQty = (int) BorrowRequest::where('asset_id', $asset->id)
                ->whereIn('status', ['borrowed', 'awaiting_check'])
                ->sum('borrow_amount');

            $remaining = max(0, (int) $asset->amount - $activeQty);
            $threshold = max(1, (int) ceil((int) $asset->amount * 0.20));

            if ($remaining > $threshold) {
                if ($asset->low_stock_notified_at !== null) {
                    $asset->update(['low_stock_notified_at' => null]);
                }

                continue;
            }

            $lastNotified = $asset->low_stock_notified_at;

            if ($lastNotified !== null && ! $lastNotified->isBefore(now()->startOfDay())) {
                continue;
            }

            $custodians = User::where('role', 'custodian')->get();

            foreach ($custodians as $custodian) {
                $custodian->notify(new LowStockNotification($asset, $remaining));
            }

            $asset->update(['low_stock_notified_at' => now()]);
            $sent++;
        }

        $this->info("Sent {$sent} low-stock alert(s).");

        return self::SUCCESS;
    }
}
