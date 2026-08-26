<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('avatar is null when the user has no profile photo', function () {
    $user = User::factory()->create([
        'profile_photo_path' => null,
    ]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->where('auth.user.avatar', null),
        );
});

test('avatar resolves to the storage url of the profile photo', function () {
    $user = User::factory()->create([
        'profile_photo_path' => 'profile-photos/example.jpg',
    ]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->where('auth.user.avatar', '/storage/profile-photos/example.jpg'),
        );
});
