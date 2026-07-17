<?php

namespace Database\Seeders;

use App\Models\BorrowRequest;
use App\Models\Employee;
use App\Models\ReturnRecord;
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

        $employee = Employee::where('user_id', $user->id)->first();

        BorrowRequest::factory()
            ->count(500)
            ->create([
                'employee_id' => $employee->id,
            ]);

        BorrowRequest::factory()
            ->count(50)
            ->create([
                'employee_id' => $employee->id,
                'status' => 'borrowed',
                'returned_at' => null,
                'expected_return_date' => now()->subDays(rand(1, 30)),
            ]);
    }
}
