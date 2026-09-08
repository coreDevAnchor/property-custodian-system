<?php

return [
    'provider' => env('CAPTCHA_PROVIDER', 'recaptcha'),

    'site_key' => env('RECAPTCHA_SITE_KEY', ''),

    'secret_key' => env('RECAPTCHA_SECRET_KEY', ''),

    'min_score' => (float) env('RECAPTCHA_MIN_SCORE', 0.5),

    'failures_threshold' => (int) env('RECAPTCHA_FAILURES_THRESHOLD', 2),
];