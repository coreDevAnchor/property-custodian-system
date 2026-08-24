<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::create([
            'name' => 'Electronics',
            'prefix' => 'ELEC',
            'description' => 'Electronic devices and equipment',
        ]);

        Category::create([
            'name' => 'Furniture',
            'prefix' => 'FURN',
            'description' => 'Office furniture and fixtures',
        ]);

        Category::create([
            'name' => 'Office Equipment',
            'prefix' => 'OFF',
            'description' => 'Office machines and equipment',
        ]);

        Category::create([
            'name' => 'Office Supplies',
            'prefix' => 'OFFSUP',
            'description' => 'Consumable office supplies and materials',
            'unit_type' => Category::UNIT_MULTI,
        ]);
    }
}