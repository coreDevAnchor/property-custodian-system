<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReturnReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected BorrowRequest $borrow
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
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