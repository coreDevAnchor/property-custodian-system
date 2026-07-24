<?php

namespace Database\Seeders;

use App\Models\BorrowRequest;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

class BorrowRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'employee@example.com')->first();

        if (!$user) {
            $this->command->error('User employee@example.com not found!');
            return;
        }

        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            $this->command->error("No employee profile found for user {$user->id}!");
            return;
        }

        // Wipe existing records for this specific employee
        BorrowRequest::where('employee_id', $employee->id)->delete();

        // 1. Create standard randomized borrow history
        BorrowRequest::factory()
            ->count(500)
            ->create();

        // 2. Create specific overdue/active items
        BorrowRequest::factory()
            ->count(50)
            ->create([
                'status' => 'borrowed',
                'returned_at' => null,
                'expected_return_date' => now()->subDays(rand(1, 30)),
            ]);
    }
}