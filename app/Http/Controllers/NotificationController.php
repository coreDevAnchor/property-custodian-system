<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20)
            ->through(fn ($notification) => [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'reminder',
                'title' => $notification->data['title'] ?? 'Asset reminder',
                'message' => $notification->data['message'] ?? '',
                'asset_name' => $notification->data['asset_name'] ?? null,
                'asset_tag' => $notification->data['asset_tag'] ?? null,
                'due_date' => $notification->data['due_date'] ?? null,
                'read_at' => $notification->read_at?->toISOString(),
                'created_at' => $notification->created_at->toISOString(),
            ]);

        return Inertia::render('notifications', [
            'notifications' => $notifications,
            'unreadCount' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail()
            ->markAsRead();

        return back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
