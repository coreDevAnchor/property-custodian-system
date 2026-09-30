<?php

namespace App\Notifications;

use App\Models\Asset;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Asset $asset,
        protected int $remaining
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'low_stock',
            'title' => 'Low stock alert',
            'message' => "{$this->asset->name} ({$this->asset->asset_tag}) is running low — {$this->remaining} of {$this->asset->amount} units left.",
            'asset_name' => $this->asset->name,
            'asset_tag' => $this->asset->asset_tag,
            'remaining' => $this->remaining,
            'amount' => $this->asset->amount,
        ];
    }
}
