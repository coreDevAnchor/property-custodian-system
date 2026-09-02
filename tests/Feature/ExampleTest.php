<?php

test('home redirects guests to the login screen', function () {
    // Root route intentionally redirects guests to login (routes/web.php).
    $response = $this->get(route('home'));

    $response->assertRedirect('/login');
});
