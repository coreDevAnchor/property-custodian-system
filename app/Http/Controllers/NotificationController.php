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
        $perPage = (int) $request->input('per_page', 20);
        $perPage = in_array($perPage, [10, 12, 15, 20, 25, 50, 100], true)
            ? $perPage
            : 20;

        $notifications = $request->user()
            ->notifications()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
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

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail()
            ->delete();

        return back();
    }

    public function destroyRead(Request $request): RedirectResponse
    {
        $request->user()
            ->readNotifications()
            ->delete();

        return back();
    }

    public function markAsUnread(Request $request, string $notification): RedirectResponse
    {
        $notification = $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        $notification->update([
            'read_at' => null,
        ]);

        return back();
    }
}
