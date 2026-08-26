<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ResetOtpMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class OtpResetController extends Controller
{
    /**
     * Number of seconds the OTP stays valid.
     */
    private const OTP_TTL = 180;

    /**
     * Number of seconds before another OTP can be requested.
     */
    private const RESEND_COOLDOWN = 60;

    /**
     * Maximum incorrect OTP verification attempts.
     */
    private const MAX_ATTEMPTS = 5;

    /**
     * Send a password reset OTP to the given email address.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower($validated['email']);

        $user = User::whereRaw('lower(email) = ?', [$email])->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found with that email address.',
            ], 422);
        }

        $cooldownKey = "pwd-otp-cd:{$email}";
        $cooldownUntil = (int) Cache::get($cooldownKey, 0);
        $now = now()->timestamp;

        if ($cooldownUntil > $now) {
            return response()->json([
                'message' => 'Please wait before requesting another code.',
                'resend_in' => $cooldownUntil - $now,
            ], 422);
        }

        Cache::put($cooldownKey, $now + self::RESEND_COOLDOWN, self::RESEND_COOLDOWN);

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put("pwd-otp:{$email}", [
            'hash' => hash('sha256', $otp),
            'attempts' => 0,
            'expires_at' => $now + self::OTP_TTL,
        ], self::OTP_TTL);

        Mail::to($user->email)->send(new ResetOtpMail($otp, $user->name));

        return response()->json([
            'message' => "We sent a 6-digit code to {$email}. It expires in 3 minutes.",
            'expires_in' => self::OTP_TTL,
        ]);
    }

    /**
     * Verify the OTP and update the user's password.
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'string', Password::defaults() ?? Password::min(8)],
        ]);

        $email = strtolower($request->input('email'));
        $key = "pwd-otp:{$email}";

        $entry = Cache::get($key);

        if (! $entry) {
            return response()->json([
                'message' => 'This code is invalid or has expired. Please request a new one.',
            ], 422);
        }

        if ($entry['attempts'] >= self::MAX_ATTEMPTS) {
            Cache::forget($key);

            return response()->json([
                'message' => 'Too many incorrect attempts. Please request a new code.',
            ], 422);
        }

        if (! hash_equals($entry['hash'], hash('sha256', $request->input('otp')))) {
            $entry['attempts']++;

            $remainingTtl = max(1, $entry['expires_at'] - now()->timestamp);
            Cache::put($key, $entry, $remainingTtl);
            Cache::forget("pwd-otp-cd:{$email}");

            $left = self::MAX_ATTEMPTS - $entry['attempts'];

            return response()->json([
                'message' => "Incorrect code. {$left} ".($left === 1 ? 'attempt' : 'attempts').' remaining.',
            ], 422);
        }

        $user = User::whereRaw('lower(email) = ?', [$email])->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found with that email address.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        Cache::forget($key);
        Cache::forget("pwd-otp-cd:{$email}");

        return response()->json([
            'message' => 'Password changed successfully. You can now sign in with your new password.',
        ]);
    }
}
