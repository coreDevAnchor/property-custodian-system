<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            'Information Technology',
            'Human Resources',
            'Finance',
            'Operations',
            'Marketing',
        ];

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