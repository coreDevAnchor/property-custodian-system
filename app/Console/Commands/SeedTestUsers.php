<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SeedTestUsers extends Command
{
    protected $signature = 'seed:test-users';

    protected $description = 'Create test users for k6 load testing (5 employees + 3 custodians)';

    private string $password = 'Password123!';

    public function handle(): int
    {
        $this->createCustodians();
        $this->createEmployees();

        $this->newLine();
        $this->info('Test users seeded successfully.');
        $this->table(
            ['Email', 'Password', 'Role'],
            array_merge(
                collect(range(1, 3))->map(fn ($i) => ["loadcust{$i}@test.com", $this->password, 'custodian'])->toArray(),
                collect(range(1, 5))->map(fn ($i) => ["loademp{$i}@test.com", $this->password, 'employee'])->toArray(),
            )
        );

        return Command::SUCCESS;
    }

    private function createCustodians(): void
    {
        $this->info('Creating custodian accounts...');

        for ($i = 1; $i <= 3; $i++) {
            $email = "loadcust{$i}@test.com";

            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => "Load Test Custodian {$i}",
                    'password' => Hash::make($this->password),
                    'role' => 'custodian',
                    'email_verified_at' => now(),
                    'must_change_password' => false,
                ]
            );

            $this->line("  ✓ {$email}");
        }
    }

    private function createEmployees(): void
    {
        $this->info('Creating employee accounts...');

        $departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];

        for ($i = 1; $i <= 5; $i++) {
            $email = "loademp{$i}@test.com";

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => "Load Test Employee {$i}",
                    'password' => Hash::make($this->password),
                    'role' => 'employee',
                    'email_verified_at' => now(),
                    'must_change_password' => false,
                ]
            );

            Employee::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'department' => $departments[($i - 1) % count($departments)],
                    'employee_id' => 'EMP-' . str_pad(9000 + $i, 4, '0', STR_PAD_LEFT),
                    'contact' => '09' . str_pad($i, 9, '0', STR_PAD_LEFT),
                    'is_active' => true,
                ]
            );

            $this->line("  ✓ {$email}");
        }
    }
}
