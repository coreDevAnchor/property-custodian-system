<?php

namespace Database\Seeders;

use App\Models\BorrowRenewal;
use App\Models\BorrowRequest;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class BorrowRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demo = User::where('email', 'javeanchor@gmail.com')->first();

        if (!$demo) {
            $this->command->error('User javeanchor@gmail.com not found!');

            return;
        }

        $demoEmployee = Employee::where('user_id', $demo->id)->first();

        if (!$demoEmployee) {
            $this->command->error("No employee profile found for user {$demo->id}!");

            return;
        }

        $custodianIds = User::where('role', 'custodian')->pluck('id');

        // Wipe existing data for clean, idempotent re-runs.
        BorrowRenewal::query()->delete();
        BorrowRequest::query()->delete();

        // ── Target demo employee: same-employee dataset (dominant) ──
        $this->seedBatch($demoEmployee->id, $demo->id, $custodianIds, 11100, 'returned', 0.15, 0.04);
        $this->seedBatch($demoEmployee->id, $demo->id, $custodianIds, 1000, 'awaiting_check', 0, 0.20);
        $this->seedBatch($demoEmployee->id, $demo->id, $custodianIds, 600, 'borrowed', 0, 0);
        $this->seedBatch($demoEmployee->id, $demo->id, $custodianIds, 750, 'overdue', 1, 0);
        $this->seedBatch($demoEmployee->id, $demo->id, $custodianIds, 1000, 'pending', 0, 0);

        // ── Other employees: fill Top-5 analytics + shared activity ──
        $others = Employee::where('user_id', '!=', $demo->id)
            ->with('user')
            ->inRandomOrder()
            ->take(5)
            ->get();

        $others->each(function (Employee $employee) use ($custodianIds) {
            $this->seedBatch($employee->id, $employee->user_id, $custodianIds, 800, 'returned', 0.15, 0.04);
            $this->seedBatch($employee->id, $employee->user_id, $custodianIds, 80, 'awaiting_check', 0, 0.20);
            $this->seedBatch($employee->id, $employee->user_id, $custodianIds, 60, 'borrowed', 0, 0);
            $this->seedBatch($employee->id, $employee->user_id, $custodianIds, 70, 'overdue', 1, 0);
            $this->seedBatch($employee->id, $employee->user_id, $custodianIds, 100, 'pending', 0, 0);
        });

        $this->seedRenewals($custodianIds);
    }

    /**
     * Insert a batch of borrow records with dates spread across the last 11 months.
     *
     * Statuses:
     * - returned: closed history with ok/defective/lost returns
     * - awaiting_check: submitted for return, waiting custodian inspection
     * - borrowed: actively borrowed, not overdue (expected date in the future)
     * - overdue: borrowed but expected date already passed
     * - pending: awaiting custodian approval
     */
    private function seedBatch(
        int $employeeId,
        int $borrowerId,
        $custodianIds,
        int $count,
        string $status,
        float $overdueShare,
        float $lostShare,
    ): void {
        $rows = [];

        $assetIds = \App\Models\Asset::inRandomOrder()->pluck('id')->all();
        $assetCount = count($assetIds);

        for ($i = 0; $i < $count; $i++) {
            $isOverdue = fake()->boolean($overdueShare * 100);
            $isLost = fake()->boolean($lostShare * 100);

            $requestedAt = Carbon::now()
                ->subMonths(fake()->randomFloat(1, 0, 11))
                ->subDays(fake()->numberBetween(0, 29))
                ->subMinutes(fake()->numberBetween(0, 1439));

            $approvedAt = null;
            $returnedAt = null;
            $expectedReturn = null;
            $returnCondition = null;
            $lostReason = null;

            if ($status === 'pending') {
                $expectedReturn = now()->addDays(fake()->numberBetween(3, 21));
            } elseif ($status === 'borrowed') {
                // Active, not overdue: request was recent and due date is in the future.
                $requestedAt = Carbon::now()->subDays(fake()->numberBetween(0, 21))
                    ->subMinutes(fake()->numberBetween(0, 1439));
                $approvedAt = $requestedAt->copy()->addDays(fake()->numberBetween(0, 2));
                $expectedReturn = now()->addDays(fake()->numberBetween(1, 30));
            } elseif ($status === 'overdue') {
                $approvedAt = $requestedAt->copy()->addDays(fake()->numberBetween(0, 3));
                $expectedReturn = now()
                    ->subDays(fake()->numberBetween(1, 45))
                    ->startOfDay();
            } elseif ($status === 'awaiting_check') {
                // Employee submitted for return; custodian inspection pending.
                $approvedAt = $requestedAt->copy()->addDays(fake()->numberBetween(0, 3));
                $expectedReturn = $approvedAt->copy()->addDays(fake()->numberBetween(3, 30));
                $returnedAt = now()->subDays(fake()->numberBetween(0, 4))
                    ->subHours(fake()->numberBetween(0, 23));

                if ($isLost) {
                    $returnCondition = 'lost';
                    $lostReason = fake()->sentence();
                }
            } else {
                // returned
                $approvedAt = $requestedAt->copy()->addDays(fake()->numberBetween(0, 3));
                $borrowDays = fake()->numberBetween(2, 40);
                $expectedReturn = $approvedAt->copy()->addDays($borrowDays);

                $onTime = fake()->boolean($isOverdue ? 0 : 80);
                $returnedAt = $onTime
                    ? $expectedReturn->copy()->subDays(fake()->numberBetween(0, 3))
                    : $expectedReturn->copy()->addDays(fake()->numberBetween(1, 20));

                if ($isLost) {
                    $returnCondition = 'lost';
                    $lostReason = fake()->sentence();
                } else {
                    $returnCondition = fake()->randomFloat(2) < 0.80 ? 'ok' : 'defective';
                }
            }

            $rows[] = [
                'asset_id' => $assetIds[$i % $assetCount],
                'employee_id' => $employeeId,
                'borrower_id' => $borrowerId,
                'approved_by' => $approvedAt ? $custodianIds->random() : null,
                'checked_by' => $status === 'returned' ? $custodianIds->random() : null,
                'status' => $status === 'overdue' ? 'borrowed' : $status,
                'requested_at' => $requestedAt,
                'approved_at' => $approvedAt,
                'returned_at' => $returnedAt,
                'return_condition' => $returnCondition,
                'lost_reason' => $lostReason,
                'is_acknowledged' => $status !== 'pending',
                'remarks' => fake()->optional(0.3)->sentence(),
                'expected_return_date' => $expectedReturn?->toDateString(),
                'created_at' => $requestedAt,
                'updated_at' => $returnedAt ?? $requestedAt,
            ];

            if (count($rows) >= 400) {
                BorrowRequest::insert($rows);
                $rows = [];
            }
        }

        if (count($rows) > 0) {
            BorrowRequest::insert($rows);
        }

        $this->command->info("Inserted {$count} borrow records (status: {$status}).");
    }

    /**
     * Attach renewal requests to a subset of the currently-borrowed records
     * (status `borrowed`, including overdue ones). Mixed pending/approved/rejected
     * so the renewal-review dashboard and history have data.
     */
    private function seedRenewals($custodianIds): void
    {
        $borroweds = BorrowRequest::where('status', 'borrowed')
            ->select(['id', 'expected_return_date'])
            ->get();

        if ($borroweds->isEmpty()) {
            $this->command->warn('No borrowed borrows found; skipping renewals.');

            return;
        }

        $target = min(2000, $borroweds->count());
        $selected = $borroweds->shuffle()->take($target);

        $rows = [];
        $approvedIds = [];

        foreach ($selected as $borrow) {
            $base = $borrow->expected_return_date
                ? Carbon::parse($borrow->expected_return_date)
                : Carbon::now()->subDays(fake()->numberBetween(1, 10));

            $requestedDue = $base->copy()->addDays(fake()->numberBetween(7, 30));

            $roll = fake()->numberBetween(1, 100);

            $status = $roll <= 40 ? 'pending' : ($roll <= 80 ? 'approved' : 'rejected');

            $approvedBy = $status === 'pending' ? null : $custodianIds->random();
            $approvedAt = $status === 'pending' ? null : now()->subDays(fake()->numberBetween(0, 6));

            $rows[] = [
                'borrow_id' => $borrow->id,
                'requested_due_date' => $requestedDue->toDateString(),
                'reason' => fake()->sentence(),
                'status' => $status,
                'approved_by' => $approvedBy,
                'approved_at' => $approvedAt,
                'remarks' => $status === 'rejected' ? fake()->optional()->sentence() : null,
                'created_at' => $approvedAt ?? now()->subDays(fake()->numberBetween(1, 10)),
                'updated_at' => $approvedAt ?? now()->subDays(fake()->numberBetween(0, 2)),
            ];

            if ($status === 'approved') {
                $approvedIds[$borrow->id] = [
                    'borrow_id' => $borrow->id,
                    'requested_due_date' => $requestedDue->toDateString(),
                ];
            }
        }

        if (!empty($rows)) {
            foreach (array_chunk($rows, 400) as $chunk) {
                BorrowRenewal::insert($chunk);
            }
        }

        // Replicate controller behaviour: an approved renewal moves the
        // borrow's expected return date out to the requested due date.
        if (!empty($approvedIds)) {
            foreach (array_chunk($approvedIds, 400) as $chunk) {
                foreach ($chunk as $update) {
                    BorrowRequest::where('id', $update['borrow_id'])
                        ->update(['expected_return_date' => $update['requested_due_date']]);
                }
            }
        }

        $this->command->info("Inserted " . count($rows) . " renewal records.");
    }
}
