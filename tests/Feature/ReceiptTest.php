<?php

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Location;
use App\Models\User;

function createReceiptAsset(Category $category): Asset
{
    $location = Location::create(['name' => 'Main Lab '.uniqid()]);
    $type = AssetType::create([
        'name' => 'Laptop',
        'category_id' => $category->id,
        'prefix' => 'LAP-'.uniqid(),
    ]);

    return Asset::create([
        'name' => 'Test Laptop',
        'asset_tag' => 'ITQ-2026-'.str_pad((string) Asset::count(), 4, '0', STR_PAD_LEFT),
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $type->id,
        'status' => 'borrowed',
        'acquisition_cost' => 50000.00,
        'condition' => 'excellent',
        'acquisition_date' => now()->format('Y-m-d'),
    ]);
}

test('receipts index lists only unprinted borrowed receipts', function () {
    $custodian = User::factory()->custodian()->create();

    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);

    $assetUnprinted = createReceiptAsset($category);
    $assetPrinted = createReceiptAsset($category);
    $assetPending = createReceiptAsset($category);

    $borrower = User::factory()->employee()->create();
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    $printedBorrower = User::factory()->employee()->create();
    $printedEmployee = Employee::where('user_id', $printedBorrower->id)->firstOrFail();

    $pendingBorrower = User::factory()->employee()->create();
    $pendingEmployee = Employee::where('user_id', $pendingBorrower->id)->firstOrFail();

    $unprinted = BorrowRequest::factory()->create([
        'asset_id' => $assetUnprinted->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'borrowed',
        'approved_by' => $custodian->id,
        'approved_at' => now(),
    ]);

    BorrowRequest::factory()->create([
        'asset_id' => $assetPrinted->id,
        'employee_id' => $printedEmployee->id,
        'borrower_id' => $printedBorrower->id,
        'status' => 'borrowed',
        'approved_by' => $custodian->id,
        'approved_at' => now(),
        'receipt_printed_at' => now(),
        'receipt_printed_by' => $custodian->id,
    ]);

    BorrowRequest::factory()->create([
        'asset_id' => $assetPending->id,
        'employee_id' => $pendingEmployee->id,
        'borrower_id' => $pendingBorrower->id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($custodian)->get(route('custodian.receipts.index'));

    $response->assertOk();
    $response->assertSee($unprinted->borrower->name);
    $response->assertDontSee($printedBorrower->name);
    $response->assertDontSee($pendingBorrower->name);
});

test('printing a receipt returns a pdf without marking it printed', function () {
    $custodian = User::factory()->custodian()->create();

    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);
    $asset = createReceiptAsset($category);

    $borrower = User::factory()->employee()->create();
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    $borrow = BorrowRequest::factory()->create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'borrowed',
        'approved_by' => $custodian->id,
        'approved_at' => now(),
    ]);

    $this->actingAs($custodian)->get(route('custodian.receipts.print', $borrow->id))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');

    $borrow->refresh();
    expect($borrow->receipt_printed_at)->toBeNull();

    $this->actingAs($custodian)->get(route('custodian.receipts.index'))
        ->assertSee($borrower->name);
});

test('marking a receipt as done records it printed and removes it from the index', function () {
    $custodian = User::factory()->custodian()->create();

    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);
    $asset = createReceiptAsset($category);

    $borrower = User::factory()->employee()->create();
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    $borrow = BorrowRequest::factory()->create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'borrowed',
        'approved_by' => $custodian->id,
        'approved_at' => now(),
    ]);

    $this->actingAs($custodian)
        ->post(route('custodian.receipts.mark-printed', $borrow->id))
        ->assertStatus(302);

    $borrow->refresh();
    expect($borrow->receipt_printed_at)->not->toBeNull();
    expect($borrow->receipt_printed_by)->toBe($custodian->id);

    $this->actingAs($custodian)->get(route('custodian.receipts.index'))
        ->assertDontSee($borrower->name);
});

test('a non-borrowed request cannot be printed', function () {
    $custodian = User::factory()->custodian()->create();

    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);
    $asset = createReceiptAsset($category);

    $borrower = User::factory()->employee()->create();
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    $borrow = BorrowRequest::factory()->create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'pending',
    ]);

    $this->actingAs($custodian)
        ->get(route('custodian.receipts.print', $borrow->id))
        ->assertNotFound();

    $borrow->refresh();
    expect($borrow->receipt_printed_at)->toBeNull();
});

test('a non-borrowed request cannot be marked as done', function () {
    $custodian = User::factory()->custodian()->create();

    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);
    $asset = createReceiptAsset($category);

    $borrower = User::factory()->employee()->create();
    $employee = Employee::where('user_id', $borrower->id)->firstOrFail();

    $borrow = BorrowRequest::factory()->create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $borrower->id,
        'status' => 'pending',
    ]);

    $this->actingAs($custodian)
        ->post(route('custodian.receipts.mark-printed', $borrow->id))
        ->assertNotFound();

    $borrow->refresh();
    expect($borrow->receipt_printed_at)->toBeNull();
});
