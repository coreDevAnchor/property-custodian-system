<?php

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

function importEmployeeCsv(array $rows, string $name = 'employees.csv'): UploadedFile
{
    $header = 'Full Name,Email,Department,Contact Number';

    $body = implode("\n", array_map(
        fn ($row) => implode(',', $row),
        $rows,
    ));

    return UploadedFile::fake()->createWithContent($name, $header."\n".$body);
}

test('employee import template downloads as xlsx and csv', function () {
    $custodian = User::factory()->custodian()->create();

    foreach (['xlsx', 'csv'] as $format) {
        $this->actingAs($custodian)
            ->get(route('custodian.employees.import.template', ['format' => $format]))
            ->assertOk()
            ->assertDownload("employee-import-template.{$format}");
    }
});

test('employee import creates accounts with employee records and the default password', function () {
    $custodian = User::factory()->custodian()->create();
    $file = importEmployeeCsv([
        ['Juan Dela Cruz', 'juan@example.com', 'IT Department', '09171234567'],
        ['Jane Smith', 'jane@example.com', 'Finance', '09172345678'],
    ]);

    $this->actingAs($custodian)
        ->post(route('custodian.employees.import'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('success', 'Imported 2 employees from Excel.');

    $juan = User::where('email', 'juan@example.com')->first();

    expect($juan)->not->toBeNull();
    expect($juan->role)->toBe('employee');
    expect(Hash::check('Password123!', $juan->password))->toBeTrue();
    expect($juan->employee->department)->toBe('IT Department');
    expect($juan->employee->contact)->toBe('09171234567');
    expect($juan->employee->is_active)->toBeTrue();
    expect($juan->employee->employee_id)->not->toBeNull();

    $jane = User::where('email', 'jane@example.com')->first();
    expect($jane->employee->department)->toBe('Finance');
    expect($jane->employee->contact)->toBe('09172345678');
    expect(Employee::count())->toBe(2);
});

test('employee import preview reports totals without creating records', function () {
    $custodian = User::factory()->custodian()->create();
    $file = importEmployeeCsv([
        ['Juan Dela Cruz', 'juan@example.com', 'IT Department', '09171234567'],
        ['Jane Smith', 'jane@example.com', 'Finance', '09172345678'],
    ]);

    $response = $this->actingAs($custodian)
        ->post(route('custodian.employees.import.preview'), ['file' => $file]);

    $response->assertOk();
    $response->assertJsonPath('summary.total', 2);
    $response->assertJsonPath('rows.0.email', 'juan@example.com');
    $response->assertJsonPath('rows.0.status', 'new');
    $response->assertJsonPath('rows.1.department', 'Finance');

    expect(User::where('email', 'juan@example.com')->exists())->toBeFalse();
    expect(User::where('email', 'jane@example.com')->exists())->toBeFalse();
    expect(Employee::count())->toBe(0);
});

test('employee import rejects unexpected columns', function () {
    $file = UploadedFile::fake()->createWithContent(
        'employees.csv',
        "Full Name,Email,Department,Contact Number,Extra\nJuan,juan@example.com,Finance,09171234567,x",
    );

    $response = $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.employees.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Unexpected column(s)'));
});

test('employee import rejects a department outside the allowed list', function () {
    $file = importEmployeeCsv([
        ['Juan Dela Cruz', 'juan@example.com', 'Sales', '09171234567'],
    ]);

    $response = $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.employees.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Department must be one of'));
    expect(User::where('email', 'juan@example.com')->exists())->toBeFalse();
});

test('employee import rejects duplicate emails within the same file', function () {
    $file = importEmployeeCsv([
        ['Juan Dela Cruz', 'juan@example.com', 'IT Department', '09171234567'],
        ['Juan Again', 'juan@example.com', 'Finance', '09172345678'],
    ]);

    $response = $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.employees.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Email is already in use'));
    expect(User::where('email', 'juan@example.com')->exists())->toBeFalse();
});

test('employee import rejects a contact number already in use', function () {
    $existing = User::factory()->employee()->create();
    $existing->employee->update(['contact' => '09171234567']);

    $file = importEmployeeCsv([
        ['Jane Smith', 'jane@example.com', 'Finance', '09171234567'],
    ]);

    $response = $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.employees.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Contact Number is already in use'));
    expect(User::where('email', 'jane@example.com')->exists())->toBeFalse();
});

test('employee import saves nothing when a row has a problem', function () {
    $file = importEmployeeCsv([
        ['Juan Dela Cruz', 'juan@example.com', 'IT Department', '12345'],
    ]);

    $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.employees.import'), ['file' => $file])
        ->assertSessionHasErrors('file');

    expect(User::where('email', 'juan@example.com')->exists())->toBeFalse();
    expect(Employee::count())->toBe(0);
});