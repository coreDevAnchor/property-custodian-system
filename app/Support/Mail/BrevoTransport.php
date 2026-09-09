<?php

namespace App\Support\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

class BrevoTransport extends AbstractTransport
{
    private const API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

    public function __construct(
        private readonly string $apiKey,
        ?EventDispatcherInterface $dispatcher = null,
    ) {
        parent::__construct($dispatcher);
    }

    protected function doSend(SentMessage $sentMessage): void
    {
        $message = $sentMessage->getOriginalMessage();

        if (! $message instanceof Email) {
            throw new TransportException('Brevo transport requires a Symfony Email message.');
        }

        $from = $this->firstAddress($message->getFrom());

        if ($from === null) {
            throw new TransportException('Brevo transport requires a sender address.');
        }

        $payload = [
            'sender' => $this->payloadAddress($from),
            'to' => $this->payloadAddressList($message->getTo()),
            'subject' => $message->getSubject(),
        ];

        if ($message->getHtmlBody() !== null) {
            $payload['htmlContent'] = $message->getHtmlBody();
        }

        if (($text = $message->getTextBody()) !== null) {
            $payload['textContent'] = $text;
        }

        if (($cc = $this->payloadAddressList($message->getCc())) !== []) {
            $payload['cc'] = $cc;
        }

        if (($bcc = $this->payloadAddressList($message->getBcc())) !== []) {
            $payload['bcc'] = $bcc;
        }

        if (($replyTo = $this->firstAddress($message->getReplyTo())) !== null) {
            $payload['replyTo'] = $this->payloadAddress($replyTo);
        }

        $response = Http::asJson()
            ->acceptJson()
            ->withHeaders(['api-key' => $this->apiKey])
            ->post(self::API_ENDPOINT, $payload);

        if (! $response->successful()) {
            throw new TransportException(
                "Brevo API error: HTTP {$response->status()} — {$response->body()}",
                $response->status(),
            );
        }
    }

    public function __toString(): string
    {
        return 'brevo';
    }

    private function payloadAddress(Address $address): array
    {
        $email = $address->getAddress();

        return [
            'email' => $email,
            'name' => $address->getName() !== '' ? $address->getName() : strstr($email, '@', true),
        ];
    }

    private function payloadAddressList(array $addresses): array
    {
        return array_map(
            fn (Address $address) => $this->payloadAddress($address),
            $addresses,
        );
    }

    private function firstAddress(array $addresses): ?Address
    {
        return $addresses[0] ?? null;
    }
}
