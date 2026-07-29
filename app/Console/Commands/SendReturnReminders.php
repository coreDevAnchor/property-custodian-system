<?php

namespace App\Console\Commands;

use App\Models\BorrowRequest;
use App\Models\User;
use App\Notifications\ReturnReminderNotification;
use Illuminate\Console\Command;
use App\Notifications\DeadlineReminderNotification;

class SendReturnReminders extends Command
{
    protected $signature = 'reminders:send-return';

    protected $description = 'Send return reminder emails for assets due in 3 days';

    public function handle(): int
    {
        // 3-day reminders
        $threeDayBorrows = BorrowRequest::with(['asset', 'borrower'])
            ->where('status', 'borrowed')
            ->whereDate('expected_return_date', now()->addDays(3))
            ->where('three_day_reminder_sent', false)
            ->get();

        foreach ($threeDayBorrows as $borrow) {
            $user = $borrow->borrower;

            if (! $user) {
                $this->warn("Skipping borrow #{$borrow->id}: missing borrower.");
                continue;
            }

            $this->notifyRecipients($user, fn () => new ReturnReminderNotification($borrow));

            $borrow->update([
                'three_day_reminder_sent' => true,
                'three_day_reminder_sent_at' => now(),
            ]);
        }

        // Due today reminders
        $deadlineBorrows = BorrowRequest::with(['asset', 'borrower'])
            ->where('status', 'borrowed')
            ->whereDate('expected_return_date', now())
            ->where('deadline_reminder_sent', false)
            ->get();

        foreach ($deadlineBorrows as $borrow) {
            $user = $borrow->borrower;

            if (! $user) {
                $this->warn("Skipping borrow #{$borrow->id}: missing borrower.");
                continue;
            }

            $this->notifyRecipients($user, fn () => new DeadlineReminderNotification($borrow));

            $borrow->update([
                'deadline_reminder_sent' => true,
                'deadline_reminder_sent_at' => now(),
            ]);
        }

        $this->info(
            "{$threeDayBorrows->count()} three-day reminder(s) sent, " .
            "{$deadlineBorrows->count()} deadline reminder(s) sent."
        );

        return self::SUCCESS;
    }

    private function notifyRecipients(User $borrower, \Closure $notification): void
    {
        User::query()
            ->where('role', 'custodian')
            ->get()
            ->push($borrower)
            ->unique('id')
            ->each(fn (User $user) => $user->notify($notification()));
    }
}
