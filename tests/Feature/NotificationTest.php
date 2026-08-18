<?php

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

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

test('notifications with the same creation time stay in place when their read state changes', function () {
    $user = User::factory()->employee()->create();
    $createdAt = now()->startOfSecond();

    $notifications = collect([
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000003',
    ])->map(fn (string $id) => DatabaseNotification::query()->create([
        'id' => $id,
        'type' => 'App\\Notifications\\ReturnReminderNotification',
        'notifiable_type' => $user->getMorphClass(),
        'notifiable_id' => $user->getKey(),
        'data' => ['type' => 'return_reminder', 'title' => 'Asset reminder', 'message' => 'Return your asset.'],
        'created_at' => $createdAt,
        'updated_at' => $createdAt,
    ]));

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('notifications')
            ->where('notifications.data.0.id', $notifications[2]->id)
            ->where('notifications.data.1.id', $notifications[1]->id)
            ->where('notifications.data.2.id', $notifications[0]->id)
        );

    $this->patch(route('notifications.read', $notifications[1]))
        ->assertRedirect();

    $this->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notifications.data.0.id', $notifications[2]->id)
            ->where('notifications.data.1.id', $notifications[1]->id)
            ->where('notifications.data.1.read_at', fn ($value) => $value !== null)
            ->where('notifications.data.2.id', $notifications[0]->id)
            ->where('notifications.data.2.read_at', null)
        );

    $this->patch(route('notifications.unread', $notifications[1]))
        ->assertRedirect();

    $this->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notifications.data.0.id', $notifications[2]->id)
            ->where('notifications.data.1.id', $notifications[1]->id)
            ->where('notifications.data.1.read_at', null)
            ->where('notifications.data.2.id', $notifications[0]->id)
        );
});

test('users can choose how many notifications appear on each page', function () {
    $user = User::factory()->employee()->create();

    foreach (range(1, 21) as $index) {
        DatabaseNotification::query()->create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\ReturnReminderNotification',
            'notifiable_type' => $user->getMorphClass(),
            'notifiable_id' => $user->getKey(),
            'data' => ['type' => 'return_reminder', 'title' => "Reminder {$index}", 'message' => 'Return your asset.'],
        ]);
    }

    $this->actingAs($user)
        ->get(route('notifications.index', ['per_page' => 10, 'page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notifications.current_page', 2)
            ->where('notifications.per_page', 10)
            ->has('notifications.data', 10)
        );

    $this->get(route('notifications.index', ['per_page' => 20]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('notifications.current_page', 1)
            ->where('notifications.per_page', 20)
            ->has('notifications.data', 20)
        );
});
