<?php

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

test('users can view and mark only their notifications as read', function () {
    $user = User::factory()->employee()->create();
    $otherUser = User::factory()->custodian()->create();

    $notification = DatabaseNotification::query()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\ReturnReminderNotification',
        'notifiable_type' => $user->getMorphClass(),
        'notifiable_id' => $user->getKey(),
        'data' => ['type' => 'return_reminder', 'title' => 'Asset return due in 3 days', 'message' => 'Laptop is due soon.'],
    ]);

    $otherNotification = DatabaseNotification::query()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\ReturnReminderNotification',
        'notifiable_type' => $otherUser->getMorphClass(),
        'notifiable_id' => $otherUser->getKey(),
        'data' => ['type' => 'return_reminder', 'title' => 'Asset return due in 3 days', 'message' => 'Monitor is due soon.'],
    ]);

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertOk();

    $this->patch(route('notifications.read', $notification))
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();

    $this->patch(route('notifications.read', $otherNotification))
        ->assertNotFound();
});
