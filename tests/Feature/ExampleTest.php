<?php

use function Pest\Laravel\get;

test('returns a successful response', function () {
    $response = get('/');

    $response->assertRedirect(route('login'));
});
