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
        public string $processedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'return_confirmed',
            'title' => match ($this->returnCondition) {
                'lost' => 'Return Confirmed — Lost',
                'defective' => 'Return Confirmed — Defective',
                default => 'Return Confirmed',
            },
            'message' => match ($this->returnCondition) {
                'lost' => "Your return request for {$this->assetName} has been processed. The asset was confirmed as lost.\n\nProcessed by custodian: {$this->processedBy}",
                'defective' => "Your return of {$this->assetName} has been confirmed. The asset was recorded as defective and placed under repair.\n\nProcessed by custodian: {$this->processedBy}",
                default => "Your return of {$this->assetName} has been confirmed by the custodian.\n\nProcessed by custodian: {$this->processedBy}",
            },
            'asset_name' => $this->assetName,
            'return_condition' => $this->returnCondition,
            'processed_by' => $this->processedBy,
        ];
    }
}