<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Location::create([
            'name' => 'Luzon Office',
            'description' => 'Main office in Luzon',
        ]);

        Location::create([
            'name' => 'Visayas Office',
            'description' => 'Regional office in Visayas',
        ]);

        Location::create([
            'name' => 'Mindanao Office',
            'description' => 'Regional office in Mindanao',
        ]);
    }
}