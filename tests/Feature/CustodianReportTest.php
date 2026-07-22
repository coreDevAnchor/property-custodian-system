<?php

use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Location;
use App\Models\User;

test('overdue report displays custodian borrowers without employee profiles', function () {
    $reportViewer = User::factory()->custodian()->create();
    $custodianBorrower = User::factory()->custodian()->create([
        'name' => 'Custodian Borrower',
    ]);
    $category = Category::create(['name' => 'Furniture', 'prefix' => 'FUR']);
    $location = Location::create(['name' => 'Main Office']);
    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'location_id' => $location->id,
    ]);

    BorrowRequest::create([
        'asset_id' => $asset->id,
        'borrower_id' => $custodianBorrower->id,
        'status' => 'borrowed',
        'requested_at' => now()->subDays(10),
        'approved_at' => now()->subDays(9),
        'is_acknowledged' => true,
        'expected_return_date' => now()->subDay(),
    ]);

    $this->actingAs($reportViewer)
        ->get(route('custodian.reports', ['view' => 'overdue']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('custodian/reports')
            ->where('overdueItems.data.0.borrower', 'Custodian Borrower'));
});
