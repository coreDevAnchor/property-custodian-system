<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BorrowRequest>
 */
class BorrowRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = BorrowRequest::class;

    public function definition(): array
    {
        // 1. Fetch target user and corresponding employee record
        $user = User::where('email', 'javeanchor@gmail.com')->first();
        $employee = $user ? Employee::where('user_id', $user->id)->first() : null;

        $status = fake()->randomElement([
            'pending',
            'borrowed',
            'awaiting_check',
            'returned',
            'rejected',
        ]);

        $requestedAt = fake()->dateTimeBetween('-11 months', '-1 week');

        $approvedAt = in_array($status, [
            'borrowed',
            'awaiting_check',
            'returned',
        ])
            ? fake()->dateTimeBetween($requestedAt, 'now')
            : null;

        $returnedAt = $status === 'returned'
            ? fake()->dateTimeBetween($approvedAt ?? '-1 week', 'now')
            : null;

        // 25% chance of overdue if item is still active
        $isOverdue = in_array($status, ['borrowed', 'awaiting_check'])
            && fake()->boolean(25);

        return [
            'asset_id' => Asset::inRandomOrder()->value('id'),

            // Consistently assign the targeted employee & user IDs
            'employee_id' => $employee?->id ?? Employee::inRandomOrder()->value('id'),
            'borrower_id' => $user?->id ?? User::inRandomOrder()->value('id'),

            'approved_by' => $approvedAt
                ? User::where('role', 'custodian')
                    ->inRandomOrder()
                    ->value('id')
                : null,

            'checked_by' => $status === 'returned'
                ? User::where('role', 'custodian')
                    ->inRandomOrder()
                    ->value('id')
                : null,

            'status' => $status,

            'requested_at' => $requestedAt,
            'approved_at' => $approvedAt,
            'returned_at' => $returnedAt,

            'return_condition' => $status === 'returned'
                ? fake()->randomElement(['ok', 'defective'])
                : null,

            'is_acknowledged' => $status !== 'pending',

            'remarks' => fake()->optional()->sentence(),

            'expected_return_date' => match (true) {
                $status === 'returned' =>
                fake()->dateTimeBetween($approvedAt, $returnedAt),

                $isOverdue =>
                fake()->dateTimeBetween('-30 days', '-1 day'),

                in_array($status, ['borrowed', 'awaiting_check']) =>
                fake()->dateTimeBetween('now', '+30 days'),

                default => null,
            },
        ];
    }
}