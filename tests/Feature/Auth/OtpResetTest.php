<?php

use App\Mail\ResetOtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

function otpCacheKey(string $email): string
{
    return 'pwd-otp:'.strtolower($email);
}

function sentOtpCode(): string
{
    $mailables = Mail::sent(ResetOtpMail::class);

    expect($mailables)->toHaveCount(1);

    return $mailables[0]->otp;
}

test('otp send validates the email field', function () {
    $response = $this->postJson('/forgot-password/otp', ['email' => 'not-an-email']);

    $response->assertUnprocessable();
});

test('otp send rejects an email with no account', function () {
    Mail::fake();

    $response = $this->postJson('/forgot-password/otp', ['email' => 'nobody@example.com']);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'No account found with that email address.');

    Mail::assertNothingSent();
});

test('otp is emailed and cached as a hash with a 3 minute ttl', function () {
    Mail::fake();

    $user = User::factory()->create();

    $response = $this->postJson('/forgot-password/otp', [
        'email' => strtoupper($user->email),
    ]);

    $response->assertOk()
        ->assertJsonPath('expires_in', 180);

    Mail::assertSent(ResetOtpMail::class, function (ResetOtpMail $mail) use ($user) {
        expect($mail->hasTo($user->email))->toBeTrue()
            ->and($mail->otp)->toMatch('/^\d{6}$/');

        return true;
    });

    $entry = Cache::get(otpCacheKey($user->email));

    expect($entry)->not->toBeNull()
        ->and($entry['hash'])->toBe(hash('sha256', sentOtpCode()))
        ->and($entry['attempts'])->toBe(0);
});

test('otp cannot be resent while the cooldown is active', function () {
    Mail::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $response = $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Please wait before requesting another code.');
});

test('password can be reset with the correct otp', function () {
    Mail::fake();

    $user = User::factory()->create();
    $oldPassword = $user->password;

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $otp = sentOtpCode();

    $response = $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => $otp,
        'password' => 'new-secure-password',
    ]);

    $response->assertOk()
        ->assertJsonPath('message', 'Password changed successfully. You can now sign in with your new password.');

    $user->refresh();

    expect(Hash::check('new-secure-password', $user->password))->toBeTrue()
        ->and($user->password)->not->toBe($oldPassword)
        ->and(Cache::get(otpCacheKey($user->email)))->toBeNull();
});

test('the otp is single use', function () {
    Mail::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $otp = sentOtpCode();

    $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => $otp,
        'password' => 'new-secure-password',
    ]);

    $response = $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => $otp,
        'password' => 'another-password',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'This code is invalid or has expired. Please request a new one.');
});

test('an incorrect otp increments attempts and reports remaining tries', function () {
    Mail::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $response = $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => '000000',
        'password' => 'new-secure-password',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Incorrect code. 4 attempts remaining.');

    $entry = Cache::get(otpCacheKey($user->email));

    expect($entry['attempts'])->toBe(1);
});

test('the otp expires after 3 minutes', function () {
    Mail::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $otp = sentOtpCode();

    $this->travel(3)->minutes();

    $response = $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => $otp,
        'password' => 'new-secure-password',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'This code is invalid or has expired. Please request a new one.');
});

test('too many incorrect attempts invalidate the otp', function () {
    Mail::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $otp = sentOtpCode();

    foreach (range(1, 5) as $i) {
        $this->postJson('/forgot-password/otp/reset', [
            'email' => $user->email,
            'otp' => str_pad((string) ($i * 111111 % 1000000), 6, '0', STR_PAD_LEFT),
            'password' => 'new-secure-password',
        ]);
    }

    $response = $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => $otp,
        'password' => 'new-secure-password',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Too many incorrect attempts. Please request a new code.');

    expect(Cache::get(otpCacheKey($user->email)))->toBeNull();
});

test('reset validates the password', function () {
    Mail::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password/otp', ['email' => $user->email]);

    $otp = sentOtpCode();

    $response = $this->postJson('/forgot-password/otp/reset', [
        'email' => $user->email,
        'otp' => $otp,
        'password' => 'short',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('password');
});
