<?php

namespace App\Notifications\Concerns;

trait SkipsEmailForUnverifiedUsers
{
    protected function viaChannels(object $notifiable): array
    {
        if ($notifiable->email_verified_at === null) {
            return ['database'];
        }

        return ['mail', 'database'];
    }
}
