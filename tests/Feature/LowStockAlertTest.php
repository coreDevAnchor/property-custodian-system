<?php

use App\Console\Commands\SendLowStockAlerts;
use App\Models\Asset;
use App\Models\AssetType;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Location;
use App\Models\User;

function createLowStockAsset(Category $category, int $amount): Asset
{
    $location = Location::create(['name' => 'Main Lab '.uniqid()]);
    $type = AssetType::create([
        'name' => 'Bulk Unit',
        'category_id' => $category->id,
        'prefix' => 'BULK-'.uniqid(),
    ]);

    return Asset::create([
        'name' => 'Bulk Pack',
        'asset_tag' => 'ITQ-2026-'.str_pad((string) Asset::count(), 4, '0', STR_PAD_LEFT),
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $type->id,
        'status' => 'available',
        'amount' => $amount,
        'acquisition_cost' => 5000.00,
        'condition' => 'excellent',
        'acquisition_date' => now()->format('Y-m-d'),
    ]);
}

function activeBorrowFor(Asset $asset, int $qty, User $borrower, User $custodian): BorrowRequest
{
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    return BorrowRequest::factory()->create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'borrowed',
        'approved_by' => $custodian->id,
        'approved_at' => now(),
        'borrow_amount' => $qty,
    ]);
}

test('custodians are notified when multi-unit stock drops to 20 percent or less', function () {
    $custodianOne = User::factory()->custodian()->create();
    $custodianTwo = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = Category::create(['name' => 'Bulk Supplies', 'prefix' => 'BLK', 'unit_type' => 'multi']);
    $asset = createLowStockAsset($category, 10);
    activeBorrowFor($asset, 8, $borrower, $custodianOne);

    $this->artisan(SendLowStockAlerts::class)->assertSuccessful();

    foreach ([$custodianOne, $custodianTwo] as $custodian) {
        $notification = $custodian->notifications()->first();

        expect($notification)->not->toBeNull();
        expect($notification->data['type'])->toBe('low_stock');
        expect($notification->data['remaining'])->toBe(2);
        expect($notification->data['amount'])->toBe(10);
    }
});

test('no notification when multi-unit stock is above 20 percent', function () {
    $custodian = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = Category::create(['name' => 'Bulk Supplies', 'prefix' => 'BLK', 'unit_type' => 'multi']);
    $asset = createLowStockAsset($category, 10);
    activeBorrowFor($asset, 4, $borrower, $custodian);

    $this->artisan(SendLowStockAlerts::class)->assertSuccessful();

    expect($custodian->notifications()->count())->toBe(0);
    $asset->refresh();
    expect($asset->low_stock_notified_at)->toBeNull();
});

test('exactly 20 percent remaining is considered low stock', function () {
    $custodian = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = Category::create(['name' => 'Bulk Supplies', 'prefix' => 'BLK', 'unit_type' => 'multi']);
    $asset = createLowStockAsset($category, 10);
    activeBorrowFor($asset, 8, $borrower, $custodian);

    $this->artisan(SendLowStockAlerts::class);

    expect($custodian->notifications()->count())->toBe(1);
});

test('alerts are sent once per day while stock stays low', function () {
    $custodian = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = Category::create(['name' => 'Bulk Supplies', 'prefix' => 'BLK', 'unit_type' => 'multi']);
    $asset = createLowStockAsset($category, 10);
    activeBorrowFor($asset, 8, $borrower, $custodian);

    $this->artisan(SendLowStockAlerts::class);
    $this->artisan(SendLowStockAlerts::class);

    expect($custodian->notifications()->count())->toBe(1);
});

test('restocking clears the notified marker so a later low episode alerts again', function () {
    $custodian = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = Category::create(['name' => 'Bulk Supplies', 'prefix' => 'BLK', 'unit_type' => 'multi']);
    $asset = createLowStockAsset($category, 10);
    $borrow = activeBorrowFor($asset, 8, $borrower, $custodian);

    $this->artisan(SendLowStockAlerts::class);
    expect($custodian->notifications()->count())->toBe(1);

    $borrow->update(['status' => 'returned', 'returned_at' => now()]);
    $asset->refresh();
    $this->artisan(SendLowStockAlerts::class);

    $asset->refresh();
    expect($asset->low_stock_notified_at)->toBeNull();

    activeBorrowFor($asset, 8, $borrower, $custodian);
    $this->artisan(SendLowStockAlerts::class);

    expect($custodian->notifications()->count())->toBe(2);
});
