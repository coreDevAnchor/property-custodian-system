<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use App\Notifications\Concerns\SkipsEmailForUnverifiedUsers;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReturnReminderNotification extends Notification
{
    use Queueable;
    use SkipsEmailForUnverifiedUsers;

    public function __construct(
        protected BorrowRequest $borrow
    ) {}

    public function via(object $notifiable): array
    {
        return $this->viaChannels($notifiable);
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'return_reminder',
            'title' => 'Asset return due in 3 days',
            'message' => "{$this->borrow->asset->name} is due for return on {$this->borrow->expected_return_date->format('F d, Y')}.",
            'asset_name' => $this->borrow->asset->name,
            'asset_tag' => $this->borrow->asset->asset_tag,
            'due_date' => $this->borrow->expected_return_date->toDateString(),
            'borrow_id' => $this->borrow->id,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Asset Return Reminder')
            ->greeting("Hello {$notifiable->name},")
            ->line('This is a friendly reminder that one of your borrowed assets is due in 3 days.')
            ->line('Asset: ' . $this->borrow->asset->name)
            ->line('Return Date: ' . $this->borrow->expected_return_date->format('F d, Y'))
            ->line('Please return the asset on or before the due date.')
            ->salutation('Thank you.');
    }
}
