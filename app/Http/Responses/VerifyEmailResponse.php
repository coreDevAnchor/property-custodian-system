<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;

class VerifyEmailResponse implements VerifyEmailResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        // Inertia::location handles both SPA (409 + X-Inertia-Location) and
        // plain browser (302) requests. The `verified` query param preserves
        // the success toast rendered by HandleInertiaRequests.
        return Inertia::location($this->redirectUrl($request));
    }

    /**
     * Resolve the post-verification redirect based on the user's role.
     */
    private function redirectUrl($request): string
    {
        $user = $request->user();

        $path = match ($user?->role) {
            'custodian' => \Laravel\Fortify\Fortify::redirects('email-verification', '/custodian/dashboard'),
            'employee' => '/employee/dashboard',
            default => '/login',
        };

        return $path . '?verified=1';
    }
}
