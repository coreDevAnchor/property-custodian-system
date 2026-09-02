<?php

namespace Database\Factories;

use App\Models\AssetType;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssetTypeFactory extends Factory
{
    protected $model = AssetType::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->unique()->words(2, true),
            'prefix' => fake()->unique()->bothify('TYPE-####'),
        ];
    }
}