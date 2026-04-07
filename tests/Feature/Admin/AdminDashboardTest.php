<?php

use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

function panelCommit(): string
{
    $commit = trim((string) shell_exec(sprintf(
        'git -C %s rev-parse --short HEAD 2>/dev/null',
        escapeshellarg(base_path()),
    )));

    return $commit !== '' ? $commit : 'unknown';
}

it('forbids non-admins from viewing the admin dashboard', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)
        ->get('/admin')
        ->assertForbidden();
});

it('shows the admin overview with recent user creation data', function () {
    Carbon::setTestNow('2026-04-06 12:00:00');

    $admin = User::factory()->create([
        'is_admin' => true,
        'created_at' => now()->subDays(40),
    ]);

    User::factory()->create([
        'created_at' => now()->subDay(),
    ]);

    User::factory()->create([
        'created_at' => now(),
    ]);

    User::factory()->create([
        'created_at' => now()->subDays(31),
    ]);

    $this->actingAs($admin)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('recentUsersTotal', 2)
            ->has('recentUsers', 30)
            ->where('recentUsers.28.amount', 1)
            ->where('recentUsers.29.amount', 1)
            ->has('recentServers', 30)
            ->has('recentServersTotal')
            ->has('nodes')
            ->has('totalNodes')
            ->has('totalMemoryMib')
            ->has('totalDiskMib')
            ->where('version', config('app.version'))
            ->where('commit', panelCommit())
            ->has('usersTrendText')
            ->has('serversTrendText'),
        );

    Carbon::setTestNow();
});
