<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            'Information Technology',
            'Human Resources',
            'Finance',
            'Operations',
            'Marketing',
        ];

        // Give the fixed demo user (employee@example.com) a stable, known profile.
        $demoUser = User::firstWhere('email', 'employee@example.com');

        if ($demoUser && !$demoUser->employee) {
            Employee::create([
                'user_id' => $demoUser->id,
                'department' => 'Information Technology',
                'employee_id' => 'EMP-0001',
                'contact' => '09123456789',
                'is_active' => true,
            ]);
        }

        // Backfill a profile for every other employee-role user that doesn't have one yet
        // (covers users created by other seeders/factories, e.g. AssetSeeder's borrow data).
        User::where('role', 'employee')
            ->whereDoesntHave('employee')
            ->orderBy('id')
            ->get()
            ->each(function (User $user, int $index) use ($departments) {
                Employee::create([
                    'user_id' => $user->id,
                    'department' => $departments[array_rand($departments)],
                    'employee_id' => 'EMP-' . str_pad($index + 2, 4, '0', STR_PAD_LEFT),
                    'contact' => fake()->phoneNumber(),
                    'is_active' => true,
                ]);
            });
    }
}