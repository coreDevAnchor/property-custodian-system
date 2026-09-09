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
        User::updateOrCreate([
            'email' => 'anchorjave16@gmail.com',
        ], [
            'name' => 'Custodian User',
            'password' => 'password',
            'role' => 'custodian',
        ]);

        User::updateOrCreate([
            'email' => 'javeanchor@gmail.com',
        ], [
            'name' => 'Employee User',
            'password' => 'password',
            'role' => 'employee',
        ]);

        // User::factory()->count(99)->custodian()->create();
        // User::factory()->count(200)->employee()->create();
    }
}