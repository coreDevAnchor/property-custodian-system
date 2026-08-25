<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use App\Models\User;
use App\Notifications\Concerns\SkipsEmailForUnverifiedUsers;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ManualOverdueReminderNotification extends Notification
{
    use Queueable;
    use SkipsEmailForUnverifiedUsers;

    public function __construct(
        protected BorrowRequest $borrow,
        protected User $custodian,
    ) {}

    public function via(object $notifiable): array
    {
        return $this->viaChannels($notifiable);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'manual_overdue_reminder',
            'title' => 'Return Reminder',
            'message' => "{$this->custodian->name} reminded you to return your borrowed asset \"{$this->borrow->asset->name}\".",
            'asset_name' => $this->borrow->asset->name,
            'asset_tag' => $this->borrow->asset->asset_tag,
            'borrow_id' => $this->borrow->id,
            'due_date' => $this->borrow->expected_return_date->toDateString(),
            'sent_by' => $this->custodian->name,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Return Reminder')
            ->greeting("Hello {$notifiable->name},")
            ->line("{$this->custodian->name} has sent you a reminder to return your borrowed asset.")
            ->line('Asset: ' . $this->borrow->asset->name)
            ->line('Due Date: ' . $this->borrow->expected_return_date->format('F d, Y'))
            ->line('Please return the asset as soon as possible.')
            ->salutation('Thank you.');
    }
}