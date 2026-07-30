<?php

namespace App\Http\Middleware;

use App\Models\BorrowRequest;
use App\Models\BorrowRenewal;
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
            'sidebarOpen' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'type' => $request->session()->get('success')
                    ? 'success'
                    : ($request->session()->get('error')
                        ? 'error'
                        : ($request->session()->get('warning')
                            ? 'warning'
                            : ($request->session()->get('info') ? 'info' : null))),
                'message' => $request->session()->get('success')
                    ?? $request->session()->get('error')
                    ?? $request->session()->get('warning')
                    ?? $request->session()->get('info'),
            ],
            'counts' => $request->user()?->role === 'custodian'
                ? [
                    'pendingBorrowRequests' =>
                        BorrowRequest::where('status', '=', 'pending')->count();
                        BorrowRequest::where('status', '=', 'awaiting_check')->count();
                    'awaitingReturns' => BorrowRequest::where('status', 'awaiting_check')->count(),
                    'pendingRenewalRequests' => BorrowRenewal::where('status', 'pending')->count(),
                ]
                : null,
            'unreadNotificationCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
        ];
    }
}
