<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReturnConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $assetName,
        public string $returnCondition,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'return_confirmed',
            'title' => 'Return Confirmed',
            'message' => "Your return of {$this->assetName} has been confirmed by the custodian.",
            'asset_name' => $this->assetName,
            'return_condition' => $this->returnCondition,
        ];
    }
}