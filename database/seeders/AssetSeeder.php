<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Category;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $electronics = Category::firstWhere('name', 'Electronics');
        $furniture = Category::firstWhere('name', 'Furniture');
        $officeEquipment = Category::firstWhere('name', 'Office Equipment');

        Asset::create([
            'asset_tag' => 'ELEC-0001',
            'name' => 'Dell Latitude 5420',
            'description' => 'Company-issued laptop',
            'category_id' => $electronics->id,
            'serial_number' => 'DL5420-001',
            'acquisition_date' => '2026-01-15',
            'acquisition_cost' => 45000.00,
            'depreciation_rate' => 10.00,
            'condition' => 5,
            'status' => 'available',
            'location' => 'IT Office',
            'remarks' => 'Good condition',
        ]);

        Asset::create([
            'asset_tag' => 'ELEC-0002',
            'name' => 'Epson Projector',
            'description' => 'Meeting room projector',
            'category_id' => $electronics->id,
            'serial_number' => 'EPSON-002',
            'acquisition_date' => '2026-02-10',
            'acquisition_cost' => 28000.00,
            'depreciation_rate' => 10.00,
            'condition' => 4,
            'status' => 'borrowed',
            'location' => 'Conference Room',
            'remarks' => null,
        ]);

        Asset::create([
            'asset_tag' => 'FURN-0001',
            'name' => 'Office Chair',
            'description' => 'Ergonomic office chair',
            'category_id' => $furniture->id,
            'serial_number' => 'CHR-001',
            'acquisition_date' => '2026-03-05',
            'acquisition_cost' => 6500.00,
            'depreciation_rate' => 5.00,
            'condition' => 5,
            'status' => 'available',
            'location' => 'HR Department',
            'remarks' => null,
        ]);

        Asset::create([
            'asset_tag' => 'OFF-0001',
            'name' => 'HP LaserJet Pro',
            'description' => 'Office printer',
            'category_id' => $officeEquipment->id,
            'serial_number' => 'HP-PRT-001',
            'acquisition_date' => '2026-04-20',
            'acquisition_cost' => 12000.00,
            'depreciation_rate' => 8.00,
            'condition' => 4,
            'status' => 'under_repair',
            'location' => 'Admin Office',
            'remarks' => 'Paper feed issue',
        ]);

        Asset::create([
            'asset_tag' => 'ELEC-0003',
            'name' => 'Lenovo ThinkPad',
            'description' => 'Backup company laptop',
            'category_id' => $electronics->id,
            'serial_number' => 'LNV-003',
            'acquisition_date' => '2026-05-18',
            'acquisition_cost' => 42000.00,
            'depreciation_rate' => 10.00,
            'condition' => 5,
            'status' => 'available',
            'location' => 'Storage Room',
            'remarks' => null,
        ]);
    }
}