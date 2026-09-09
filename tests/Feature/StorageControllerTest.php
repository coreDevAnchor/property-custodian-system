<?php

use Illuminate\Support\Facades\Storage;

test('storage proxy serves an existing asset photo', function () {
    Storage::fake('public');
    Storage::disk('public')->put('assets/front.jpg', 'photo-bytes');

    $this->get('/storage/assets/front.jpg')
        ->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');
});

test('storage proxy serves an existing profile photo', function () {
    Storage::fake('public');
    Storage::disk('public')->put('profile-photos/alice.jpg', 'avatar-bytes');

    $this->get('/storage/profile-photos/alice.jpg')
        ->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');
});

test('storage proxy rejects paths outside allowed folders', function () {
    Storage::fake('public');
    Storage::disk('public')->put('secrets/keys.txt', 'nope');

    $this->get('/storage/secrets/keys.txt')->assertNotFound();
});

test('storage proxy returns 404 for missing files', function () {
    Storage::fake('public');

    $this->get('/storage/assets/missing.jpg')->assertNotFound();
});
