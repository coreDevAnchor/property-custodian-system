<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DeadlineReminderNotification extends Notification
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
            ->subject('Asset Return Due Today')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a reminder that the following borrowed asset is due for return today.')
            ->line('Asset: ' . $this->borrow->asset->name)
            ->line('Due Date: ' . $this->borrow->expected_return_date->format('F d, Y'))
            ->line('Please return the asset as soon as possible to avoid it becoming overdue.')
            ->salutation('Property Custodian System');
    }
}