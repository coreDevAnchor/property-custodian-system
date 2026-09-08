<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class LoginAttemptThrottle
{
    public const MIN_LOCK_THRESHOLD = 3;

    public const HOUR_LOCK_THRESHOLD = 5;

    public const DAY_LOCK_THRESHOLD = 10;

    public const CAPTCHA_THRESHOLD = 2;

    public const MIN_LOCK_SECONDS = 60;

    public const HOUR_LOCK_SECONDS = 3600;

    public const DAY_LOCK_SECONDS = 86400;

    public static function key(Request $request): string
    {
        $email = (string) $request->input('email');

        return md5(Str::transliterate(Str::lower($email).'|'.$request->ip()));
    }

    public static function minuteFailures(string $key): int
    {
        return (int) Cache::get(self::minuteKey($key), 0);
    }

    public static function hourFailures(string $key): int
    {
        return (int) Cache::get(self::hourKey($key), 0);
    }

    public static function dayFailures(string $key): int
    {
        return (int) Cache::get(self::dayKey($key), 0);
    }

    public static function needsCaptcha(string $key, int $threshold): bool
    {
        return
            self::hourFailures($key) >= $threshold ||
            self::dayFailures($key) >= $threshold;
    }

    public static function track(string $key): void
    {
        Cache::add(self::minuteKey($key), 1, self::MIN_LOCK_SECONDS)
            || Cache::increment(self::minuteKey($key));

        Cache::add(self::hourKey($key), 1, self::HOUR_LOCK_SECONDS)
            || Cache::increment(self::hourKey($key));

        Cache::add(self::dayKey($key), 1, self::DAY_LOCK_SECONDS)
            || Cache::increment(self::dayKey($key));

        if (self::minuteFailures($key) >= self::MIN_LOCK_THRESHOLD) {
            Cache::put(self::minuteLockKey($key), now()->addSeconds(self::MIN_LOCK_SECONDS)->getTimestamp(), self::MIN_LOCK_SECONDS);
        }

        if (self::hourFailures($key) >= self::HOUR_LOCK_THRESHOLD) {
            Cache::put(self::hourLockKey($key), now()->addSeconds(self::HOUR_LOCK_SECONDS)->getTimestamp(), self::HOUR_LOCK_SECONDS);
        }

        if (self::dayFailures($key) >= self::DAY_LOCK_THRESHOLD) {
            Cache::put(self::dayLockKey($key), now()->addSeconds(self::DAY_LOCK_SECONDS)->getTimestamp(), self::DAY_LOCK_SECONDS);
        }
    }

    public static function clear(string $key): void
    {
        Cache::forget(self::minuteKey($key));
        Cache::forget(self::hourKey($key));
        Cache::forget(self::dayKey($key));
        Cache::forget(self::minuteLockKey($key));
        Cache::forget(self::hourLockKey($key));
        Cache::forget(self::dayLockKey($key));
    }

    public static function retryAfter(string $key): ?int
    {
        $now = now()->getTimestamp();
        $dayLock = Cache::get(self::dayLockKey($key));

        if ($dayLock) {
            return max(0, (int) $dayLock - $now);
        }

        $hourLock = Cache::get(self::hourLockKey($key));

        if ($hourLock) {
            return max(0, (int) $hourLock - $now);
        }

        $minuteLock = Cache::get(self::minuteLockKey($key));

        if ($minuteLock) {
            return max(0, (int) $minuteLock - $now);
        }

        return null;
    }

    public static function humanize(int $seconds): string
    {
        if ($seconds >= 3540) {
            $hours = (int) round($seconds / 3600);

            return $hours === 1 ? '1 hour' : "{$hours} hours";
        }

        if ($seconds >= 30) {
            $minutes = (int) round($seconds / 60);

            return $minutes === 1 ? '1 minute' : "{$minutes} minutes";
        }

        return $seconds <= 1 ? '1 second' : "{$seconds} seconds";
    }

    private static function minuteKey(string $key): string
    {
        return "login_failures:{$key}:min";
    }

    private static function hourKey(string $key): string
    {
        return "login_failures:{$key}:hour";
    }

    private static function dayKey(string $key): string
    {
        return "login_failures:{$key}:day";
    }

    private static function minuteLockKey(string $key): string
    {
        return "login_failures:{$key}:min_lock";
    }

    private static function hourLockKey(string $key): string
    {
        return "login_failures:{$key}:hour_lock";
    }

    private static function dayLockKey(string $key): string
    {
        return "login_failures:{$key}:day_lock";
    }
}