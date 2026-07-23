<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('users can change their required initial password and access their dashboard', function () {
    $user = User::factory()->employee()->create([
        'must_change_password' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('password.force.update'), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirect(route('employee.dashboard'));

    $user->refresh();

    expect($user->must_change_password)->toBeFalse()
        ->and(Hash::check('new-password', $user->password))->toBeTrue();

    $this->actingAs($user)
        ->get(route('employee.dashboard'))
        ->assertOk();
});
