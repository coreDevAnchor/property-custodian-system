<?php

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('custodian can create an employee account with a single employee record', function () {
    $custodian = User::factory()->custodian()->create();

    $this->actingAs($custodian)
        ->post(route('custodian.employees.store'), [
            'name' => 'Juan Dela Cruz',
            'email' => 'juan.delacruz@example.com',
            'department' => 'IT Department',
            'contact' => '09171234567',
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Employee account created successfully.');

    $user = User::where('email', 'juan.delacruz@example.com')->first();

    expect($user)->not->toBeNull();
    expect(Hash::check('Password123!', $user->password))->toBeTrue();

    $records = Employee::where('user_id', $user->id)->get();

    expect($records)->toHaveCount(1);
    expect($user->employee->department)->toBe('IT Department');
    expect($user->employee->contact)->toBe('09171234567');
    expect($user->employee->is_active)->toBeTrue();
});

test('employee account is not created when the contact number is already in use', function () {
    $existing = User::factory()->employee()->create();
    $existing->employee->update(['contact' => '09171234567']);

    $custodian = User::factory()->custodian()->create();

    $this->actingAs($custodian)
        ->post(route('custodian.employees.store'), [
            'name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'department' => 'Finance',
            'contact' => '09171234567',
        ])
        ->assertSessionHasErrors('contact');

    expect(Employee::where('contact', '09171234567')->count())->toBe(1);
    expect(User::where('email', 'jane.smith@example.com')->exists())->toBeFalse();
});

test('employee account is not created with a malformed contact number', function () {
    $custodian = User::factory()->custodian()->create();

    $this->actingAs($custodian)
        ->post(route('custodian.employees.store'), [
            'name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'department' => 'Finance',
            'contact' => '12345',
        ])
        ->assertSessionHasErrors('contact');

    expect(User::where('email', 'jane.smith@example.com')->exists())->toBeFalse();
});

test('updating employee to another employees contact number is rejected', function () {
    $userA = User::factory()->employee()->create();
    $userA->employee->update(['department' => 'Finance', 'contact' => '09171234567']);

    $userB = User::factory()->employee()->create();
    $userB->employee->update(['department' => 'Accounting', 'contact' => '09987654321']);

    $custodian = User::factory()->custodian()->create();

    $this->actingAs($custodian)
        ->put(route('custodian.employees.update', $userB->employee->id), [
            'name' => $userB->name,
            'email' => $userB->email,
            'department' => 'Accounting',
            'employee_id' => $userB->employee->employee_id,
            'contact' => '09171234567',
            'is_active' => true,
        ])
        ->assertSessionHasErrors('contact');
});

test('updating keeps the employees own contact number', function () {
    $user = User::factory()->employee()->create();
    $user->employee->update(['department' => 'Accounting', 'contact' => '09987654321']);

    $custodian = User::factory()->custodian()->create();

    $this->actingAs($custodian)
        ->put(route('custodian.employees.update', $user->employee->id), [
            'name' => $user->name,
            'email' => $user->email,
            'department' => 'Accounting',
            'employee_id' => $user->employee->employee_id,
            'contact' => '09987654321',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($user->employee->fresh()->contact)->toBe('09987654321');
});