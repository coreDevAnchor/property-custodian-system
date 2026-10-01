<?php

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;

function importCsvFile(array $rows, string $name = 'assets.csv'): UploadedFile
{
    $header = 'Name,Asset-Tag,Category,Asset Type,Acquisition Cost,Total Depreciation,Amount,Returnable,Consumable';

    $body = implode("\n", array_map(
        fn ($row) => implode(',', $row),
        $rows,
    ));

    return UploadedFile::fake()->createWithContent($name, $header."\n".$body);
}

test('a blank amount imports a single-unit asset', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Desk', 'D-0001', 'Furniture', 'Office Desk', '1200', '100', '', 'T', ''],
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
        ['Chair', 'C-0001', 'Furniture', 'Office Chair', '800', '40', '1', 'T', ''],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Furniture')->value('unit_type'))->toBe('single');
    expect(Asset::where('name', 'Chair')->first()->amount)->toBe(1);
});

test('an amount greater than one imports a multi-unit asset', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Monitor Bundle', 'M-0001', 'Electronics', 'Monitor', '6000', '600', '6', 'T', ''],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Electronics')->value('unit_type'))->toBe('multi');
    expect(Asset::where('name', 'Monitor Bundle')->first()->amount)->toBe(6);
});

test('a new category with mixed single and multi rows becomes multi-unit', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Mouse', 'P-0001', 'Peripherals', 'Mouse', '300', '0', '1', 'T', ''],
        ['Monitor', 'P-0002', 'Peripherals', 'Monitor', '3000', '0', '3', 'T', ''],
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
        ['MacBook', 'LAP-TEST', 'Electronics', 'Laptop', '90000', '9000', '1', 'T', ''],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $existingFile]);

    expect(Category::count())->toBe(1);
    expect(AssetType::count())->toBe(1);
    expect(Asset::where('name', 'MacBook')->first()->asset_type_id)->toBe($category->assetTypes()->first()->id);

    $differentCaseFile = importCsvFile([
        ['ThinkPad', 'LAP-TEST-2', 'electronics', 'Laptop', '80000', '8000', '1', 'T', ''],
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
        ['Keyboard', 'K-0001', 'Peripherals', 'Keyboard', '500', '0', '1', 'T', ''],
        ['Server Rack', 'K-0002', 'Hardware', 'Server', '50000', '0', '4', 'T', ''],
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
        ['', 'B-0001', 'Furniture', 'Chair', '800', '40', '0', 'T', ''],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Import aborted'));
    expect(Category::count())->toBe(0);
});

test('marking returnable sets the category to returnable', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Desk', 'D-0001', 'Furniture', 'Office Desk', '1200', '100', '1', 'True', ''],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Furniture')->value('borrow_policy'))->toBe('returnable');
});

test('marking consumable sets the category to consumable', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Ink Cartridge', 'I-0001', 'Supplies', 'Ink', '500', '0', '5', '', 'T'],
    ]);

    $this->actingAs($user)
        ->post(route('custodian.assets.import'), ['file' => $file]);

    expect(Category::where('name', 'Supplies')->value('borrow_policy'))->toBe('consumable');
});

test('returnable and consumable both marked aborts the import', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Desk', 'D-0001', 'Furniture', 'Office Desk', '1200', '100', '1', 'T', 'T'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'cannot both be True'));
    expect(Asset::count())->toBe(0);
});

test('returnable and consumable both blank aborts the import', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Desk', 'D-0001', 'Furniture', 'Office Desk', '1200', '100', '1', '', ''],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Mark exactly one'));
    expect(Asset::count())->toBe(0);
});

test('an unrecognized returnable value aborts the import', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Desk', 'D-0001', 'Furniture', 'Office Desk', '1200', '100', '1', 'maybe', ''],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'must contain True'));
    expect(Asset::count())->toBe(0);
});

test('a row conflicting with an existing category policy aborts the import', function () {
    $user = User::factory()->create();
    Category::create([
        'name' => 'Electronics',
        'prefix' => 'ELEC',
        'unit_type' => 'single',
        'borrow_policy' => 'returnable',
    ]);

    $file = importCsvFile([
        ['Laptop', 'E-0001', 'Electronics', 'Laptop', '90000', '9000', '1', '', 'T'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'already has a Returnable'));
    expect(Asset::count())->toBe(0);
});

test('a new category with conflicting policies across rows aborts the import', function () {
    $user = User::factory()->create();
    $file = importCsvFile([
        ['Chair', 'F-0001', 'Furniture', 'Chair', '800', '0', '1', 'T', ''],
        ['Desk', 'F-0002', 'Furniture', 'Desk', '1200', '0', '1', '', 'T'],
    ]);

    $response = $this->actingAs($user)
        ->post(route('custodian.assets.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'different borrowing'));
    expect(Asset::count())->toBe(0);
});
