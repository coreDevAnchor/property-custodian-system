<?php

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Location;
use App\Models\User;
use App\Notifications\LowStockNotification;
use App\Support\LowStockChecker;

function createStockAsset(Category $category, int $amount, int $original): Asset
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
        'original_amount' => $original,
        'acquisition_cost' => 5000.00,
        'condition' => 'excellent',
        'acquisition_date' => now()->format('Y-m-d'),
    ]);
}

function activeBorrowFor(Asset $asset, User $borrower): BorrowRequest
{
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    return BorrowRequest::factory()->create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'borrowed',
        'approved_at' => now(),
        'borrow_amount' => 1,
    ]);
}

function stockCategory(): Category
{
    $suffix = uniqid();

    return Category::create(['name' => 'Bulk Supplies '.$suffix, 'prefix' => 'BLK-'.$suffix, 'unit_type' => 'multi']);
}

test('custodians are notified when remaining stock reaches 5 units', function () {
    $custodianOne = User::factory()->custodian()->create();
    $custodianTwo = User::factory()->custodian()->create();

    $asset = createStockAsset(stockCategory(), amount: 5, original: 10);

    $notified = LowStockChecker::check($asset);

    expect($notified)->toBe(1);

    foreach ([$custodianOne, $custodianTwo] as $custodian) {
        $notification = $custodian->notifications()->first();

        expect($notification)->not->toBeNull();
        expect($notification->data['type'])->toBe('low_stock');
        expect($notification->data['remaining'])->toBe(5);
        expect($notification->data['total'])->toBe(10);
    }
});

test('no notification while stock is above 5 units', function () {
    $custodian = User::factory()->custodian()->create();

    $asset = createStockAsset(stockCategory(), amount: 6, original: 10);

    expect(LowStockChecker::check($asset))->toBe(0);
    expect($custodian->notifications()->count())->toBe(0);
    $asset->refresh();
    expect($asset->low_stock_notified_at)->toBeNull();
});

test('a receive that restocks the asset clears the notified marker', function () {
    $custodian = User::factory()->custodian()->create();

    $asset = createStockAsset(stockCategory(), amount: 2, original: 10);
    LowStockChecker::check($asset);
    expect($custodian->notifications()->count())->toBe(1);

    $asset->update(['amount' => 10]);
    LowStockChecker::check($asset);
    $asset->refresh();
    expect($asset->low_stock_notified_at)->toBeNull();
});

test('a new low episode after restocking alerts again', function () {
    $custodian = User::factory()->custodian()->create();

    $asset = createStockAsset(stockCategory(), amount: 2, original: 10);
    LowStockChecker::check($asset);
    expect($custodian->notifications()->count())->toBe(1);

    $asset->update(['amount' => 6]);
    LowStockChecker::check($asset);

    $asset->update(['amount' => 5]);
    LowStockChecker::check($asset);

    expect($custodian->notifications()->count())->toBe(2);
});

test('a single stock check does not duplicate notifications while still low', function () {
    $custodian = User::factory()->custodian()->create();

    $asset = createStockAsset(stockCategory(), amount: 1, original: 10);

    LowStockChecker::check($asset);
    LowStockChecker::check($asset);
    LowStockChecker::check($asset);

    expect($custodian->notifications()->count())->toBe(1);
});

test('the scheduled command alerts every low asset as a backstop', function () {
    $custodian = User::factory()->custodian()->create();

    $lowOne = createStockAsset(stockCategory(), amount: 5, original: 10);
    $lowTwo = createStockAsset(stockCategory(), amount: 1, original: 5);
    createStockAsset(stockCategory(), amount: 8, original: 10);

    $this->artisan('inventory:send-low-stock')
        ->expectsOutputToContain('low-stock')
        ->assertSuccessful();

    expect($custodian->notifications()->count())->toBe(2);
    expect($lowOne->refresh()->low_stock_notified_at)->not->toBeNull();
    expect($lowTwo->refresh()->low_stock_notified_at)->not->toBeNull();
});

test('approving a multi-unit borrow notifies custodians immediately', function () {
    $custodian = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = stockCategory();
    $asset = createStockAsset($category, amount: 6, original: 10);
    $borrow = activeBorrowFor($asset, $borrower);
    $borrow->update(['status' => 'pending', 'approved_by' => null, 'approved_at' => null]);

    $this->actingAs($custodian)
        ->put(route('custodian.borrow-requests.update', $borrow->id), [
            'status' => 'borrowed',
        ])
        ->assertRedirect();

    $asset->refresh();
    expect($asset->amount)->toBe(5);

    expect($custodian->notifications()->get())->toHaveCount(1);
    expect($custodian->notifications()->first()->data['type'])->toBe('low_stock');
});

test('a pending borrow does not trigger low-stock notifications on approval of a single-unit asset', function () {
    $custodian = User::factory()->custodian()->create();
    $borrower = User::factory()->employee()->create();

    $category = Category::create(['name' => 'Unit Gear', 'prefix' => 'UGR', 'unit_type' => 'single']);
    $asset = createStockAsset($category, amount: 1, original: 1);
    $borrow = activeBorrowFor($asset, $borrower);
    $borrow->update(['status' => 'pending', 'approved_by' => null, 'approved_at' => null]);

    $this->actingAs($custodian)
        ->put(route('custodian.borrow-requests.update', $borrow->id), [
            'status' => 'borrowed',
        ])
        ->assertRedirect();

    expect($custodian->notifications()->get())->toHaveCount(0);
});

test('low stock notifications use the database channel only', function () {
    $asset = createStockAsset(stockCategory(), amount: 2, original: 10);
    $custodian = User::factory()->custodian()->create();

    $notification = new LowStockNotification($asset, 2);

    expect($notification->via($custodian))->toBe(['database']);
});
