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

        // Electronics
        AssetType::create([
            'category_id' => $electronics->id,
            'name' => 'Laptop',
            'prefix' => 'LAP',
            'description' => 'Laptop computers',
        ]);

        AssetType::create([
            'category_id' => $electronics->id,
            'name' => 'Desktop',
            'prefix' => 'DES',
            'description' => 'Desktop computers',
        ]);

        AssetType::create([
            'category_id' => $electronics->id,
            'name' => 'Monitor',
            'prefix' => 'MON',
            'description' => 'Computer monitors',
        ]);

        AssetType::create([
            'category_id' => $electronics->id,
            'name' => 'Keyboard',
            'prefix' => 'KEY',
            'description' => 'Computer keyboards',
        ]);

        AssetType::create([
            'category_id' => $electronics->id,
            'name' => 'Mouse',
            'prefix' => 'MOU',
            'description' => 'Computer mice',
        ]);

        // Furniture
        AssetType::create([
            'category_id' => $furniture->id,
            'name' => 'Chair',
            'prefix' => 'CHR',
            'description' => 'Office chairs',
        ]);

        AssetType::create([
            'category_id' => $furniture->id,
            'name' => 'Table',
            'prefix' => 'TBL',
            'description' => 'Office tables',
        ]);

        AssetType::create([
            'category_id' => $furniture->id,
            'name' => 'Cabinet',
            'prefix' => 'CAB',
            'description' => 'Storage cabinets',
        ]);

        // Office Equipment
        AssetType::create([
            'category_id' => $office->id,
            'name' => 'Printer',
            'prefix' => 'PRT',
            'description' => 'Office printers',
        ]);

        AssetType::create([
            'category_id' => $office->id,
            'name' => 'Scanner',
            'prefix' => 'SCN',
            'description' => 'Document scanners',
        ]);

        AssetType::create([
            'category_id' => $office->id,
            'name' => 'Projector',
            'prefix' => 'PRO',
            'description' => 'Projectors',
        ]);
    }
}