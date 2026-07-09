<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::firstWhere('name', 'Electronics');
        $furniture = Category::firstWhere('name', 'Furniture');
        $officeEquipment = Category::firstWhere('name', 'Office Equipment');

        $luzon = Location::firstWhere('name', 'Luzon Office');
        $visayas = Location::firstWhere('name', 'Visayas Office');
        $mindanao = Location::firstWhere('name', 'Mindanao Office');

        // Asset Types
        $laptop = AssetType::firstWhere('name', 'Laptop');
        $projector = AssetType::firstWhere('name', 'Projector');
        $chair = AssetType::firstWhere('name', 'Chair');
        $printer = AssetType::firstWhere('name', 'Printer');

        Asset::create([
            'asset_tag' => 'LAP-0001',
            'name' => 'Dell Latitude 5420',
            'description' => 'Company-issued laptop',
            'category_id' => $electronics->id,
            'asset_type_id' => $laptop->id,
            'serial_number' => 'DL5420-001',
            'acquisition_date' => '2026-01-15',
            'acquisition_cost' => 45000.00,
            'depreciation_rate' => 10.00,
            'condition' => 5,
            'status' => 'available',
            'location_id' => $luzon->id,
            'remarks' => 'Good condition',
        ]);

        Asset::create([
            'asset_tag' => 'PRO-0001',
            'name' => 'Epson Projector',
            'description' => 'Meeting room projector',
            'category_id' => $electronics->id,
            'asset_type_id' => $projector->id,
            'serial_number' => 'EPSON-002',
            'acquisition_date' => '2026-02-10',
            'acquisition_cost' => 28000.00,
            'depreciation_rate' => 10.00,
            'condition' => 4,
            'status' => 'borrowed',
            'location_id' => $visayas->id,
            'remarks' => null,
        ]);

        Asset::create([
            'asset_tag' => 'CHR-0001',
            'name' => 'Office Chair',
            'description' => 'Ergonomic office chair',
            'category_id' => $furniture->id,
            'asset_type_id' => $chair->id,
            'serial_number' => 'CHR-001',
            'acquisition_date' => '2026-03-05',
            'acquisition_cost' => 6500.00,
            'depreciation_rate' => 5.00,
            'condition' => 5,
            'status' => 'available',
            'location_id' => $mindanao->id,
            'remarks' => null,
        ]);

        Asset::create([
            'asset_tag' => 'PRT-0001',
            'name' => 'HP LaserJet Pro',
            'description' => 'Office printer',
            'category_id' => $officeEquipment->id,
            'asset_type_id' => $printer->id,
            'serial_number' => 'HP-PRT-001',
            'acquisition_date' => '2026-04-20',
            'acquisition_cost' => 12000.00,
            'depreciation_rate' => 8.00,
            'condition' => 4,
            'status' => 'under_repair',
            'location_id' => $luzon->id,
            'remarks' => 'Paper feed issue',
        ]);

        Asset::create([
            'asset_tag' => 'LAP-0002',
            'name' => 'Lenovo ThinkPad',
            'description' => 'Backup company laptop',
            'category_id' => $electronics->id,
            'asset_type_id' => $laptop->id,
            'serial_number' => 'LNV-003',
            'acquisition_date' => '2026-05-18',
            'acquisition_cost' => 42000.00,
            'depreciation_rate' => 10.00,
            'condition' => 5,
            'status' => 'available',
            'location_id' => $visayas->id,
            'remarks' => null,
        ]);
    }
}