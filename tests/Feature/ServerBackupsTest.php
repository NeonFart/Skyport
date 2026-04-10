<?php

use App\Models\Allocation;
use App\Models\Backup;
use App\Models\Cargo;
use App\Models\Location;
use App\Models\Node;
use App\Models\NodeCredential;
use App\Models\Server;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

function backupTestDependencies(): array
{
    $location = Location::factory()->create();
    $node = Node::factory()->create([
        'daemon_port' => 2800,
        'fqdn' => 'node.example.com',
        'location_id' => $location->id,
        'use_ssl' => true,
    ]);
    $cargo = Cargo::factory()->create();

    NodeCredential::factory()->create([
        'daemon_callback_token' => 'callback-token',
        'node_id' => $node->id,
    ]);

    $user = User::factory()->create();
    $server = Server::factory()->create([
        'allocation_id' => Allocation::factory()->create(['node_id' => $node->id])->id,
        'cargo_id' => $cargo->id,
        'name' => 'Alpha',
        'node_id' => $node->id,
        'status' => 'running',
        'user_id' => $user->id,
        'backup_limit' => 3,
    ]);

    return [
        'server' => $server,
        'user' => $user,
    ];
}

test('server owner can view the backups page', function () {
    $deps = backupTestDependencies();

    actingAs($deps['user']);

    get("/server/{$deps['server']->id}/backups")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('server/backups')
            ->where('server.backup_limit', 3)
            ->has('backups', 0));
});

test('server owner can create a backup', function () {
    Http::fake();
    $deps = backupTestDependencies();

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/backups", [
        'name' => 'My Backup',
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Backup is being created.');

    expect(Backup::query()->where('server_id', $deps['server']->id)->count())->toBe(1);

    $backup = Backup::query()->where('server_id', $deps['server']->id)->first();
    expect($backup->name)->toBe('My Backup');
    expect($backup->status)->toBe('creating');
});

test('cannot exceed backup limit', function () {
    Http::fake();
    $deps = backupTestDependencies();

    Backup::factory()->count(3)->create([
        'server_id' => $deps['server']->id,
        'status' => 'completed',
    ]);

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/backups", [
        'name' => 'Over Limit',
    ])->assertSessionHasErrors('name');
});

test('cannot create backup when limit is 0', function () {
    Http::fake();
    $deps = backupTestDependencies();
    $deps['server']->update(['backup_limit' => 0]);

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/backups", [
        'name' => 'Should Fail',
    ])->assertSessionHasErrors('name');
});

test('server owner can delete a backup', function () {
    Http::fake();
    $deps = backupTestDependencies();
    $backup = Backup::factory()->create([
        'server_id' => $deps['server']->id,
    ]);

    actingAs($deps['user']);

    delete("/server/{$deps['server']->id}/backups/{$backup->id}")
        ->assertRedirect()
        ->assertSessionHas('success', 'Backup deleted.');

    expect(Backup::query()->find($backup->id))->toBeNull();
});

test('server owner can restore a backup', function () {
    Http::fake();
    $deps = backupTestDependencies();
    $backup = Backup::factory()->create([
        'server_id' => $deps['server']->id,
        'status' => 'completed',
    ]);

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/backups/{$backup->id}/restore")
        ->assertRedirect()
        ->assertSessionHas('success', 'Backup is being restored. Server files will be replaced.');

    $backup->refresh();
    expect($backup->status)->toBe('restoring');
});

test('cannot restore a non-completed backup', function () {
    Http::fake();
    $deps = backupTestDependencies();
    $backup = Backup::factory()->create([
        'server_id' => $deps['server']->id,
        'status' => 'creating',
    ]);

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/backups/{$backup->id}/restore")
        ->assertUnprocessable();
});

test('backups are listed on the page', function () {
    $deps = backupTestDependencies();

    Backup::factory()->count(2)->create([
        'server_id' => $deps['server']->id,
    ]);

    actingAs($deps['user']);

    get("/server/{$deps['server']->id}/backups")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('backups', 2));
});
