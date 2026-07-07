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
        $employeeUser = User::firstWhere('role', 'employee');

        Employee::create([
            'user_id' => $employeeUser->id,
            'department' => 'Information Technology',
            'employee_id' => 'EMP-0001',
            'contact' => '09123456789',
            'is_active' => true,
        ]);
    }
}