<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use App\Notifications\Concerns\SkipsEmailForUnverifiedUsers;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OverdueReminderNotification extends Notification
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
        $daysOverdue = $this->borrow->expected_return_date
            ->startOfDay()
            ->diffInDays(now()->startOfDay());

        return [
            'type' => 'overdue_reminder',
            'title' => 'Asset return overdue',
            'message' => "{$this->borrow->asset->name} is overdue by {$daysOverdue} day(s).",
            'asset_name' => $this->borrow->asset->name,
            'asset_tag' => $this->borrow->asset->asset_tag,
            'due_date' => $this->borrow->expected_return_date->toDateString(),
            'borrow_id' => $this->borrow->id,
            'days_overdue' => $daysOverdue,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $daysOverdue = $this->borrow->expected_return_date->diffInDays(now());

        return (new MailMessage)
            ->subject('Asset Return Overdue')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('The following borrowed asset is now overdue.')
            ->line('Asset: ' . $this->borrow->asset->name)
            ->line('Due Date: ' . $this->borrow->expected_return_date->format('F d, Y'))
            ->line("This asset is overdue by {$daysOverdue} day(s).")
            ->line('Please return the asset as soon as possible.')
            ->salutation('Property Custodian System');
    }
}