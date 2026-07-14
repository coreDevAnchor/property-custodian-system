<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'asset_tag' => fake()->unique()->bothify('AST-#####'),

            'name' => fake()->randomElement([
                'Dell Latitude Laptop',
                'HP Desktop Computer',
                'Office Chair',
                'Projector',
                'Conference Table',
                'Printer',
                'Monitor',
                'Air Conditioner',
                'Filing Cabinet',
                'Router',
            ]),

            'description' => fake()->sentence(),

            'category_id' => Category::inRandomOrder()->value('id'),

            'serial_number' => fake()->unique()->bothify('SN-########'),

            'acquisition_date' => fake()->dateTimeBetween(
                '-5 years',
                'now'
            ),

            'acquisition_cost' => fake()->numberBetween(
                5000,
                150000
            ),

            'depreciation_rate' => fake()->randomElement([
                5,
                10,
                15,
                20,
            ]),

            'condition' => fake()->numberBetween(
                1,
                5
            ),

            'status' => fake()->randomElement([
                'available',
                'borrowed',
                'under_repair',
                'disposed',
            ]),

            'photo' => null,

            'location_id' => Location::inRandomOrder()->value('id'),

            'remarks' => fake()->optional()->sentence(),
        ];
    }
}