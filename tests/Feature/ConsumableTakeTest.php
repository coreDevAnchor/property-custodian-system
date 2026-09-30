<?php

use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Employee;
use App\Models\User;

function consumableEmployee(string $employeeId): User
{
    $user = User::factory()->employee()->create();

    Employee::create([
        'user_id' => $user->id,
        'employee_id' => $employeeId,
        'department' => 'General Services',
        'contact' => '0'.fake()->numerify('9#########'),
        'is_active' => true,
    ]);

    return $user;
}

test('categories default to returnable borrow policy', function () {
    $category = Category::factory()->create();

    expect(Category::find($category->id)?->borrow_policy)
        ->toBe(Category::POLICY_RETURNABLE);
});

test('a custodian can create a consumable category', function () {
    $user = User::factory()->custodian()->create();

    $this->actingAs($user)
        ->post(route('custodian.categories.store'), [
            'name' => 'Office Supplies',
            'prefix' => 'OFFSUP',
            'unit_type' => 'multi',
            'borrow_policy' => 'consumable',
        ])
        ->assertOk()
        ->assertJsonPath('borrow_policy', 'consumable')
        ->assertJsonPath('unit_type', 'multi');
});

test('creating a category requires a valid borrow policy', function () {
    $user = User::factory()->custodian()->create();

    $this->actingAs($user)
        ->post(route('custodian.categories.store'), [
            'name' => 'Office Supplies',
            'prefix' => 'OFFSUP',
            'unit_type' => 'multi',
            'borrow_policy' => 'bogus',
        ])
        ->assertSessionHasErrors('borrow_policy');
});

test('an employee can take a consumable supply directly', function () {
    $employee = consumableEmployee('EMP-TAKE-001');

    $category = Category::factory()->create([
        'name' => 'Office Supplies',
        'unit_type' => 'multi',
        'borrow_policy' => 'consumable',
    ]);

    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
        'amount' => 20,
        'asset_tag' => 'OFFSUP-001',
    ]);

    $this->actingAs($employee)
        ->post(route('employee.consumables.take'), [
            'asset_id' => $asset->id,
            'amount' => 5,
            'remarks' => 'Printing end-of-year reports.',
        ])
        ->assertRedirect(route('employee.assets.index'))
        ->assertSessionHas('success');

    $asset->refresh();

    expect($asset->amount)->toBe(15)
        ->and($asset->status)->toBe('available');

    $this->assertDatabaseHas('borrows', [
        'asset_id' => $asset->id,
        'borrower_id' => $employee->id,
        'status' => 'consumed',
        'borrow_amount' => 5,
    ]);
});

test('taking a supply appears in the employee borrow history', function () {
    $employee = consumableEmployee('EMP-TAKE-002');

    $category = Category::factory()->create([
        'unit_type' => 'multi',
        'borrow_policy' => 'consumable',
    ]);

    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
        'amount' => 10,
        'asset_tag' => 'OFFSUP-002',
    ]);

    $this->actingAs($employee)
        ->post(route('employee.consumables.take'), [
            'asset_id' => $asset->id,
            'amount' => 2,
        ])
        ->assertRedirect();

    $this->get(route('employee.borrows.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('employee/my-borrows')
            ->has('borrows.data', 1));
});

test('consumable stock is marked unavailable when fully taken', function () {
    $employee = consumableEmployee('EMP-TAKE-003');

    $category = Category::factory()->create([
        'unit_type' => 'multi',
        'borrow_policy' => 'consumable',
    ]);

    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
        'amount' => 3,
        'asset_tag' => 'OFFSUP-003',
    ]);

    $this->actingAs($employee)
        ->post(route('employee.consumables.take'), [
            'asset_id' => $asset->id,
            'amount' => 3,
        ])
        ->assertRedirect();

    $asset->refresh();

    expect($asset->amount)->toBe(0)
        ->and($asset->status)->toBe('unavailable');
});

test('taking more than available stock is rejected', function () {
    $employee = consumableEmployee('EMP-TAKE-004');

    $category = Category::factory()->create([
        'unit_type' => 'multi',
        'borrow_policy' => 'consumable',
    ]);

    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
        'amount' => 3,
        'asset_tag' => 'OFFSUP-004',
    ]);

    $this->actingAs($employee)
        ->post(route('employee.consumables.take'), [
            'asset_id' => $asset->id,
            'amount' => 4,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($asset->fresh()->amount)->toBe(3);
});

test('a non-consumable asset cannot be taken directly', function () {
    $employee = consumableEmployee('EMP-TAKE-005');

    $category = Category::factory()->create([
        'borrow_policy' => 'returnable',
    ]);

    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
        'amount' => 1,
        'asset_tag' => 'RET-001',
    ]);

    $this->actingAs($employee)
        ->post(route('employee.consumables.take'), [
            'asset_id' => $asset->id,
            'amount' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(BorrowRequest::where('asset_id', $asset->id)->count())->toBe(0);
});

test('a consumable asset cannot be requested for borrowing', function () {
    $employee = consumableEmployee('EMP-TAKE-006');

    $category = Category::factory()->create([
        'unit_type' => 'multi',
        'borrow_policy' => 'consumable',
    ]);

    $asset = Asset::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
        'amount' => 10,
        'asset_tag' => 'OFFSUP-006',
    ]);

    $this->actingAs($employee)
        ->post(route('employee.borrow-requests.store'), [
            'asset_id' => $asset->id,
            'expected_return_date' => now()->addWeek()->toDateString(),
            'remarks' => 'Trying to borrow a consumable.',
            'borrow_amount' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(BorrowRequest::where('asset_id', $asset->id)->count())->toBe(0);
});