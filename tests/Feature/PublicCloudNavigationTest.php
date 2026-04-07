<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

test('removed compute and game hosting pages are not available', function () {
    $user = User::factory()->create();

    actingAs($user)->get('/compute/virtual-servers')->assertNotFound();

    actingAs($user)->get('/compute/settings')->assertNotFound();

    actingAs($user)->get('/game-hosting/servers')->assertNotFound();

    actingAs($user)->get('/game-hosting/domains')->assertNotFound();

    actingAs($user)->get('/game-hosting/resources')->assertNotFound();
});
