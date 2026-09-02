<?php

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;

function importCsvFile(array $rows, string $name = 'assets.csv'): UploadedFile
{
    $header = 'Name,Asset-Tag,Category,Asset Type,Acquisition Cost,Total Depreciation,Amount';

    $body = implode("\n", array_map(
        fn ($row) => implode(',', $row),
        $rows,
    ));

    return UploadedFile::fake()->createWithContent($name, $header."\n".$body);
}

test('a blank amount imports a single-unit asset', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Desk', 'D-0001', 'Furniture', 'Office Desk', '1200', '100'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file])
        ->assertRedirect(route('custodian.assets.index'));

    $category = Category::where('name', 'Furniture')->first();
    expect($category)->not->toBeNull();
    expect($category->unit_type)->toBe('single');
    expect(Asset::where('name', 'Desk')->first()->amount)->toBe(1);
});

test('an amount of one imports a single-unit asset', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Chair', 'C-0001', 'Furniture', 'Office Chair', '800', '40', '1'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Furniture')->value('unit_type'))->toBe('single');
    expect(Asset::where('name', 'Chair')->first()->amount)->toBe(1);
});

test('an amount greater than one imports a multi-unit asset', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Monitor Bundle', 'M-0001', 'Electronics', 'Monitor', '6000', '600', '6'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Electronics')->value('unit_type'))->toBe('multi');
    expect(Asset::where('name', 'Monitor Bundle')->first()->amount)->toBe(6);
});

test('a new category with mixed single and multi rows becomes multi-unit', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Mouse', 'P-0001', 'Peripherals', 'Mouse', '300', '0', '1'],
        ['Monitor', 'P-0002', 'Peripherals', 'Monitor', '3000', '0', '3'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Peripherals')->value('unit_type'))->toBe('multi');
    expect(Asset::where('name', 'Mouse')->first()->amount)->toBe(1);
    expect(Asset::where('name', 'Monitor')->first()->amount)->toBe(3);
});

test('category and asset type are matched exactly case-sensitively', function () {
    $user = User::factory()->create();
    Category::create(['name' => 'Electronics', 'prefix' => 'ELEC', 'unit_type' => 'single']);
    $category = Category::where('name', 'Electronics')->first();
    AssetType::create([
        'category_id' => $category->id,
        'name' => 'Laptop',
        'prefix' => 'LAP',
    ]);

    $existingFile = importCsvFile([
        ['MacBook', 'LAP-TEST', 'Electronics', 'Laptop', '90000', '9000', '1'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $existingFile]);

    expect(Category::count())->toBe(1);
    expect(AssetType::count())->toBe(1);
    expect(Asset::where('name', 'MacBook')->first()->asset_type_id)->toBe($category->assetTypes()->first()->id);

    $differentCaseFile = importCsvFile([
        ['ThinkPad', 'LAP-TEST-2', 'electronics', 'Laptop', '80000', '8000', '1'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $differentCaseFile]);

    expect(Category::count())->toBe(2);
    expect(Category::where('name', 'electronics')->exists())->toBeTrue();
    expect(AssetType::where('name', 'Laptop')->count())->toBe(2);
});

test('import preview writes nothing and reports unit types', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Keyboard', 'K-0001', 'Peripherals', 'Keyboard', '500', '0', '1'],
        ['Server Rack', 'K-0002', 'Hardware', 'Server', '50000', '0', '4'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertOk();
    $response->assertJsonPath('summary.total', 2);
    $response->assertJsonPath('summary.single', 1);
    $response->assertJsonPath('summary.multi', 1);
    $response->assertJsonPath('summary.categories_new', 2);
    $response->assertJsonPath('rows.1.unit_type', 'multi');

    expect(Category::count())->toBe(0);
    expect(AssetType::count())->toBe(0);
    expect(Asset::count())->toBe(0);
});

test('import preview reports row problems without aborting the file silently', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['', 'B-0001', 'Furniture', 'Chair', '800', '40', '0'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Import aborted'));
    expect(Category::count())->toBe(0);
});
