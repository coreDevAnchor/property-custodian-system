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
        AssetType::firstOrCreate(
            ['prefix' => 'LAP'],
            ['category_id' => $electronics->id, 'name' => 'Laptop', 'description' => 'Laptop computers']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'DES'],
            ['category_id' => $electronics->id, 'name' => 'Desktop', 'description' => 'Desktop computers']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'MON'],
            ['category_id' => $electronics->id, 'name' => 'Monitor', 'description' => 'Computer monitors']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'KEY'],
            ['category_id' => $electronics->id, 'name' => 'Keyboard', 'description' => 'Computer keyboards']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'MOU'],
            ['category_id' => $electronics->id, 'name' => 'Mouse', 'description' => 'Computer mice']
        );

        // Furniture
        AssetType::firstOrCreate(
            ['prefix' => 'CHR'],
            ['category_id' => $furniture->id, 'name' => 'Chair', 'description' => 'Office chairs']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'TBL'],
            ['category_id' => $furniture->id, 'name' => 'Table', 'description' => 'Office tables']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'CAB'],
            ['category_id' => $furniture->id, 'name' => 'Cabinet', 'description' => 'Storage cabinets']
        );

        // Office Equipment
        AssetType::firstOrCreate(
            ['prefix' => 'PRT'],
            ['category_id' => $office->id, 'name' => 'Printer', 'description' => 'Office printers']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'SCN'],
            ['category_id' => $office->id, 'name' => 'Scanner', 'description' => 'Document scanners']
        );

        AssetType::firstOrCreate(
            ['prefix' => 'PRO'],
            ['category_id' => $office->id, 'name' => 'Projector', 'description' => 'Projectors']
        );

        // Office Supplies
        $officeSupplies = Category::query()
            ->where('name', 'Office Supplies')
            ->first();

        if ($officeSupplies) {
            $supplies = [
                ['name' => 'PEN', 'prefix' => 'PEN', 'description' => 'Pens'],
                ['name' => 'SCISSOR', 'prefix' => 'SCR', 'description' => 'Scissors'],
                ['name' => 'BONDPAPER', 'prefix' => 'BNP', 'description' => 'Bond papers'],
                ['name' => 'STAPLERS', 'prefix' => 'STP', 'description' => 'Staplers'],
                ['name' => 'TAPE', 'prefix' => 'TAP', 'description' => 'Tapes'],
                ['name' => 'PENCIL', 'prefix' => 'PCL', 'description' => 'Pencils'],
                ['name' => 'MARKER', 'prefix' => 'MRK', 'description' => 'Markers'],
                ['name' => 'ERASER', 'prefix' => 'ERA', 'description' => 'Erasers'],
                ['name' => 'PAPER CLIP', 'prefix' => 'PCLIP', 'description' => 'Paper clips'],
            ];

            foreach ($supplies as $supply) {
                AssetType::firstOrCreate(
                    ['prefix' => $supply['prefix']],
                    [
                        'category_id' => $officeSupplies->id,
                        'name' => $supply['name'],
                        'description' => $supply['description'],
                    ]
                );
            }
        }
    }
}