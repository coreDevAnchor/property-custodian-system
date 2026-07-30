<?php

namespace App\Console\Commands;

use App\Models\BorrowRequest;
use App\Models\User;
use App\Notifications\ReturnReminderNotification;
use App\Notifications\DeadlineReminderNotification;
use App\Notifications\OverdueReminderNotification;
use Illuminate\Console\Command;

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

            $this->notifyBorrower($user, fn () => new ReturnReminderNotification($borrow));

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

            $this->notifyBorrower($user, fn () => new DeadlineReminderNotification($borrow));

            $borrow->update([
                'deadline_reminder_sent' => true,
                'deadline_reminder_sent_at' => now(),
            ]);
        }

        // Overdue reminders (once per day)
        $overdueBorrows = BorrowRequest::with(['asset', 'borrower'])
            ->where('status', 'borrowed')
            ->whereDate('expected_return_date', '<', now())
            ->get();

        foreach ($overdueBorrows as $borrow) {
            $user = $borrow->borrower;

            if (! $user) {
                $this->warn("Skipping overdue borrow #{$borrow->id}: missing borrower.");
                continue;
            }

            if (
                $borrow->overdue_last_notified_at === null ||
                $borrow->overdue_last_notified_at->isBefore(now()->startOfDay())
            ) {
                $this->notifyBorrower($user, fn () => new OverdueReminderNotification($borrow));

                $borrow->update([
                    'overdue_last_notified_at' => now(),
                ]);
            }
        }

        $this->info(
            "{$threeDayBorrows->count()} three-day reminder(s) sent, " .
            "{$deadlineBorrows->count()} deadline reminder(s) sent, " .
            "{$overdueBorrows->count()} overdue reminder(s) sent."
        );

        return self::SUCCESS;
    }

    private function notifyBorrower(User $borrower, \Closure $notification): void
    {
        $borrower->notify($notification());
    }
}
