<?php

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

function importCustodianCsv(array $rows, string $name = 'custodians.csv'): UploadedFile
{
    $header = 'Full Name,Email';

    $body = implode("\n", array_map(
        fn ($row) => implode(',', $row),
        $rows,
    ));

    return UploadedFile::fake()->createWithContent($name, $header."\n".$body);
}

test('custodian import template downloads as xlsx and csv', function () {
    $custodian = User::factory()->custodian()->create();

    foreach (['xlsx', 'csv'] as $format) {
        $this->actingAs($custodian)
            ->get(route('custodian.custodians.import.template', ['format' => $format]))
            ->assertOk()
            ->assertDownload("custodian-import-template.{$format}");
    }
});

test('custodian import creates accounts with the default password and no employee record', function () {
    $custodian = User::factory()->custodian()->create();
    $file = importCustodianCsv([
        ['Maria Santos', 'maria@example.com'],
        ['Pedro Reyes', 'pedro@example.com'],
    ]);

    $this->actingAs($custodian)
        ->post(route('custodian.custodians.import'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('success', 'Imported 2 custodians from Excel.');

    $maria = User::where('email', 'maria@example.com')->first();

    expect($maria)->not->toBeNull();
    expect($maria->role)->toBe('custodian');
    expect(Hash::check('Password123!', $maria->password))->toBeTrue();
    expect(Employee::where('user_id', $maria->id)->exists())->toBeFalse();

    $pedro = User::where('email', 'pedro@example.com')->first();
    expect($pedro->role)->toBe('custodian');
});

test('custodian import preview reports totals without creating records', function () {
    $custodian = User::factory()->custodian()->create();
    $file = importCustodianCsv([
        ['Maria Santos', 'maria@example.com'],
        ['Pedro Reyes', 'pedro@example.com'],
    ]);

    $response = $this->actingAs($custodian)
        ->post(route('custodian.custodians.import.preview'), ['file' => $file]);

    $response->assertOk();
    $response->assertJsonPath('summary.total', 2);
    $response->assertJsonPath('rows.0.name', 'Maria Santos');
    $response->assertJsonPath('rows.0.status', 'new');

    expect(User::where('email', 'maria@example.com')->exists())->toBeFalse();
    expect(User::where('email', 'pedro@example.com')->exists())->toBeFalse();
});

test('custodian import rejects an invalid email', function () {
    $file = importCustodianCsv([
        ['Maria Santos', 'not-an-email'],
    ]);

    $response = $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.custodians.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'valid email'));
    expect(User::where('email', 'maria@example.com')->exists())->toBeFalse();
});

test('custodian import rejects duplicate emails within the same file', function () {
    $file = importCustodianCsv([
        ['Maria Santos', 'maria@example.com'],
        ['Maria Again', 'maria@example.com'],
    ]);

    $response = $this->actingAs(User::factory()->custodian()->create())
        ->post(route('custodian.custodians.import.preview'), ['file' => $file]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', fn ($message) => str_contains($message, 'Email is already in use'));
    expect(User::where('email', 'maria@example.com')->exists())->toBeFalse();
});