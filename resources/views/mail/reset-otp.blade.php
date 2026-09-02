<x-mail::message>
<div style="text-align: center; padding: 8px 0 24px;">
    <img src="{{ $message->embed(public_path('images/coredev-mail-logo.png')) }}" alt="coreDev" style="height: 64px; max-width: 200px;">
</div>

# Password Reset Request

Hello {{ $recipientName }},

We received a request to reset your password. Use the code below to proceed:

<x-mail::panel>
<div style="text-align: center; padding: 8px 0;">
<span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">{{ $otp }}</span>
</div>
</x-mail::panel>

This code expires in **3 minutes**.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

Thank you,<br>
{{ config('app.name') }}
</x-mail::message>