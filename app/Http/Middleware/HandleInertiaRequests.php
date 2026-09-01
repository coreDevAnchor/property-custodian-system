<?php

namespace App\Http\Middleware;

use App\Models\BorrowRenewal;
use App\Models\BorrowRequest;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'type' => $request->session()->get('toast.type')
                    ? $request->session()->get('toast.type')
                    : ($request->session()->get('success')
                        ? 'success'
                        : ($request->session()->get('error')
                            ? 'error'
                            : ($request->session()->get('warning')
                                ? 'warning'
                                : ($request->session()->get('info')
                                    ? 'info'
                                    : ($request->boolean('verified') ? 'success' : null))))),
                'message' => $request->session()->get('toast.message')
                    ?? $request->session()->get('success')
                    ?? $request->session()->get('error')
                    ?? $request->session()->get('warning')
                    ?? $request->session()->get('info')
                    ?? ($request->boolean('verified') ? 'Your email has been validated.' : null),
            ],
            'counts' => $request->user()?->role === 'custodian'
                ? [
                    'pendingBorrowRequests' => BorrowRequest::where('status', 'pending')->count()
                        + BorrowRenewal::where('status', 'pending')->count(),
                    'awaitingReturns' => BorrowRequest::where('status', 'awaiting_check')->count(),
                ]
                : null,
            'unreadNotificationCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
        ];
    }
}
