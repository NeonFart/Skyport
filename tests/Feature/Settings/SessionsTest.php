<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('sessions page shows a safe empty state when session management is unsupported', function () {
    $user = User::factory()->create();

    config(['session.driver' => 'file']);

    $this->actingAs($user)
        ->get(route('sessions.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/sessions')
            ->where('canManageSessions', false)
            ->where(
                'sessionManagementNotice',
                'Session management is only available when the database session driver is enabled.',
            )
            ->has('sessions', 0));
});

test('sessions page lists database-backed sessions for the current user', function () {
    $user = User::factory()->create();

    config(['session.driver' => 'database']);

    DB::table('sessions')->insert([
        [
            'id' => 'session-current',
            'user_id' => $user->id,
            'ip_address' => '203.0.113.10',
            'user_agent' => 'Symfony',
            'payload' => 'payload',
            'last_activity' => now()->subMinute()->timestamp,
        ],
        [
            'id' => 'session-other',
            'user_id' => $user->id,
            'ip_address' => '203.0.113.11',
            'user_agent' => 'Firefox',
            'payload' => 'payload',
            'last_activity' => now()->subMinutes(5)->timestamp,
        ],
    ]);

    $this->actingAs($user)
        ->withSession(['_token' => 'token'])
        ->get(route('sessions.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/sessions')
            ->where('canManageSessions', true)
            ->where('sessionManagementNotice', null)
            ->has('sessions', 2));
});

test('session revocation is rejected when session management is unsupported', function () {
    $user = User::factory()->create();

    config(['session.driver' => 'file']);

    $this->actingAs($user)
        ->delete(route('sessions.destroy', 'session-other'))
        ->assertSessionHasErrors('session');
});
