<?php

use App\Support\Mail\BrevoTransport;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

it('sends a message through the Brevo API with the expected payload', function () {
    Http::fake([
        'api.brevo.com/v3/smtp/email' => Http::response(['messageId' => 'test-id'], 201),
    ]);

    $transport = new BrevoTransport('test-api-key');

    $message = (new Email)
        ->from(new Address('sender@example.com', 'Sender'))
        ->to(new Address('to@example.com', 'Recipient'))
        ->subject('Hello breach')
        ->html('<p>Hi</p>');

    $transport->send($message, Envelope::create($message));

    Http::assertSent(function ($request) {
        $payload = $request->data();

        return $request->url() === 'https://api.brevo.com/v3/smtp/email'
            && $request->hasHeader('api-key', 'test-api-key')
            && $payload['sender'] === ['email' => 'sender@example.com', 'name' => 'Sender']
            && $payload['to'][0] === ['email' => 'to@example.com', 'name' => 'Recipient']
            && $payload['subject'] === 'Hello breach'
            && $payload['htmlContent'] === '<p>Hi</p>';
    });
});

it('throws a transport exception when Brevo rejects the send', function () {
    Http::fake([
        'api.brevo.com/v3/smtp/email' => Http::response('sender not verified', 400),
    ]);

    $transport = new BrevoTransport('test-api-key');

    $message = (new Email)
        ->from(new Address('sender@example.com', 'Sender'))
        ->to('to@example.com')
        ->subject('Hello')
        ->html('<p>Hi</p>');

    expect(fn () => $transport->send($message, Envelope::create($message)))
        ->toThrow(TransportException::class, '400');
});
