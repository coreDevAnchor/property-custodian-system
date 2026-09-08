<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Custodian User',
            'email' => 'anchorjave16@gmail.com',
            'password' => 'password',
            'role' => 'custodian',
        ]);

        User::create([
            'name' => 'Employee User',
            'email' => 'javeanchor@gmail.com',
            'password' => 'password',
            'role' => 'employee',
        ]);

        // User::factory()->count(99)->custodian()->create();
        // User::factory()->count(200)->employee()->create();
    }
}