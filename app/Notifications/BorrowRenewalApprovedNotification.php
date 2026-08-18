<?php

namespace App\Notifications;

use App\Models\BorrowRenewal;
use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BorrowRenewalApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public BorrowRenewal $borrowRenewal,
        public BorrowRequest $borrow,
        public string $processedBy,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $asset = $this->borrow->asset;
        $newReturnDate = $this->borrowRenewal->requested_due_date;

        return [
            'type' => 'renewal_approved',
            'title' => 'Extension Request Approved',
            'message' => "Your extension request for {$asset->name} has been approved. New return date: {$newReturnDate->format('F d, Y')}.\n\nProcessed by custodian: {$this->processedBy}",
            'borrow_request_id' => $this->borrow->id,
            'borrow_renewal_id' => $this->borrowRenewal->id,
            'asset_id' => $asset->id,
            'asset_name' => $asset->name,
            'asset_tag' => $asset->asset_tag,
            'due_date' => $newReturnDate->toDateString(),
            'processed_by' => $this->processedBy,
        ];
    }
}
