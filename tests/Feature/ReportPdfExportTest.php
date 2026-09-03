<?php

use App\Models\User;
use App\Models\Category;
use App\Models\Asset;
use App\Models\Location;
use App\Models\AssetType;
use App\Models\Employee;
use App\Models\BorrowRequest;

test('custodians can export reports as pdf', function () {
    $custodian = User::factory()->custodian()->create();

    // Create prerequisite models to avoid factory issues
    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);
    $location = Location::create(['name' => 'Main Lab']);
    
    // We create an asset type manually to avoid issues if factory doesn't exist
    $type = AssetType::create([
        'name' => 'Laptop',
        'category_id' => $category->id,
        'prefix' => 'LAP',
    ]);

    $asset = Asset::create([
        'name' => 'Test Laptop',
        'asset_tag' => 'ITQ-2026-0001',
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $type->id,
        'status' => 'available',
        'acquisition_cost' => 50000.00,
        'condition' => 'excellent',
        'acquisition_date' => now()->format('Y-m-d'),
    ]);

    $response = $this->actingAs($custodian)
        ->get(route('custodian.reports.export-pdf', [
            'sections' => ['summary', 'assets'],
            'record_limit' => '50',
            'orientation' => 'landscape',
            'action' => 'download',
        ]));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
    
    // Assert download headers
    $contentDisposition = $response->headers->get('Content-Disposition');
    expect($contentDisposition)->toContain('attachment');
    expect($contentDisposition)->toContain('custodian_report_');
});

test('custodians can preview reports as pdf stream', function () {
    $custodian = User::factory()->custodian()->create();

    $response = $this->actingAs($custodian)
        ->get(route('custodian.reports.export-pdf', [
            'sections' => ['summary'],
            'record_limit' => 'all',
            'orientation' => 'portrait',
            'action' => 'preview',
        ]));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
    
    // Assert inline preview headers
    $contentDisposition = $response->headers->get('Content-Disposition');
    expect($contentDisposition)->toContain('inline');
});

test('custodians can export employee account history as pdf', function () {
    $custodian = User::factory()->custodian()->create();

    $category = Category::create(['name' => 'IT Equipment', 'prefix' => 'ITQ']);
    $location = Location::create(['name' => 'Main Lab']);
    $type = AssetType::create([
        'name' => 'Laptop',
        'category_id' => $category->id,
        'prefix' => 'LAP',
    ]);

    $asset = Asset::create([
        'name' => 'Test Laptop',
        'asset_tag' => 'ITQ-2026-0002',
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $type->id,
        'status' => 'available',
        'acquisition_cost' => 50000.00,
        'condition' => 'excellent',
        'acquisition_date' => now()->format('Y-m-d'),
    ]);

    $employeeUser = User::factory()->employee()->create();

    // The UserObserver auto-creates an Employee row for employee-role users.
    $employee = $employeeUser->employee;

    if (! $employee) {
        $employee = Employee::create([
            'user_id' => $employeeUser->id,
            'department' => 'Accounting',
            'employee_id' => 'EMP-001',
            'contact' => '0917-000-0000',
            'is_active' => true,
        ]);
    } else {
        $employee->update([
            'department' => 'Accounting',
            'employee_id' => 'EMP-001',
            'contact' => '0917-000-0000',
            'is_active' => true,
        ]);
    }

    BorrowRequest::create([
        'asset_id' => $asset->id,
        'employee_id' => $employee->id,
        'borrower_id' => $employeeUser->id,
        'status' => 'pending',
        'requested_at' => now(),
        'expected_return_date' => now()->addDays(3),
        'borrow_amount' => 1,
    ]);

    $response = $this->actingAs($custodian)
        ->get(route('custodian.reports.export-pdf', [
            'employees' => [$employee->id],
            'record_limit' => '10',
            'orientation' => 'portrait',
            'action' => 'download',
        ]));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');

    $contentDisposition = $response->headers->get('Content-Disposition');
    expect($contentDisposition)->toContain('attachment');
    expect($contentDisposition)->toContain('employee_account_history_');
});
