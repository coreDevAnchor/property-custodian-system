<?php

namespace App\Console\Commands;

use App\Support\LowStockChecker;
use Illuminate\Console\Command;

class SendLowStockAlerts extends Command
{
    protected $signature = 'inventory:send-low-stock';

    protected $description = 'Notify custodians when multi-unit assets are running low on stock';

    public function handle(): int
    {
        $alerted = LowStockChecker::checkAll();

        $this->info("Sent {$alerted} low-stock alert(s).");

        return self::SUCCESS;
    }
}
