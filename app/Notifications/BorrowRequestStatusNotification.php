<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BorrowRequestStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public BorrowRequest $borrowRequest,
        public ?string $rejectionMessage = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $approved = $this->borrowRequest->status === 'borrowed';

        return [
            'title' => $approved
                ? 'Borrow Request Approved'
                : 'Borrow Request Rejected',

            'message' => $approved
                ? "Your request to borrow {$this->borrowRequest->asset->name} has been approved."
                : "Your request to borrow {$this->borrowRequest->asset->name} has been rejected."
                    . ($this->rejectionMessage
                        ? "\n\nReason provided by the custodian:\n{$this->rejectionMessage}"
                        : ""),

            'borrow_request_id' => $this->borrowRequest->id,
            'asset_id' => $this->borrowRequest->asset_id,
            'status' => $this->borrowRequest->status,
        ];
    }
}