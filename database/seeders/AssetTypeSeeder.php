<?php

namespace Database\Seeders;

use App\Models\AssetType;
use App\Models\Category;
use Illuminate\Database\Seeder;

class AssetTypeSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::query()
            ->where('name', 'Electronics')
            ->firstOrFail();

        $furniture = Category::query()
            ->where('name', 'Furniture')
            ->firstOrFail();

        $office = Category::query()
            ->where('name', 'Office Equipment')
            ->firstOrFail();

        AssetType::insert([
            // Electronics
            [
                'category_id' => $electronics->id,
                'name' => 'Laptop',
                'prefix' => 'LAP',
                'description' => 'Laptop computers',
            ],
            [
                'category_id' => $electronics->id,
                'name' => 'Desktop',
                'prefix' => 'DES',
                'description' => 'Desktop computers',
            ],
            [
                'category_id' => $electronics->id,
                'name' => 'Monitor',
                'prefix' => 'MON',
                'description' => 'Computer monitors',
            ],
            [
                'category_id' => $electronics->id,
                'name' => 'Keyboard',
                'prefix' => 'KEY',
                'description' => 'Computer keyboards',
            ],
            [
                'category_id' => $electronics->id,
                'name' => 'Mouse',
                'prefix' => 'MOU',
                'description' => 'Computer mice',
            ],

            // Furniture
            [
                'category_id' => $furniture->id,
                'name' => 'Chair',
                'prefix' => 'CHR',
                'description' => 'Office chairs',
            ],
            [
                'category_id' => $furniture->id,
                'name' => 'Table',
                'prefix' => 'TBL',
                'description' => 'Office tables',
            ],
            [
                'category_id' => $furniture->id,
                'name' => 'Cabinet',
                'prefix' => 'CAB',
                'description' => 'Storage cabinets',
            ],

            // Office Equipment
            [
                'category_id' => $office->id,
                'name' => 'Printer',
                'prefix' => 'PRT',
                'description' => 'Office printers',
            ],
            [
                'category_id' => $office->id,
                'name' => 'Scanner',
                'prefix' => 'SCN',
                'description' => 'Document scanners',
            ],
            [
                'category_id' => $office->id,
                'name' => 'Projector',
                'prefix' => 'PRO',
                'description' => 'Projectors',
            ],
        ]);
    }
}