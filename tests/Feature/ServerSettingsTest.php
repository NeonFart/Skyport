<?php

use App\Models\Allocation;
use App\Models\Cargo;
use App\Models\Location;
use App\Models\Node;
use App\Models\NodeCredential;
use App\Models\Server;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;

function serverSettingsDependencies(): array
{
    $location = Location::factory()->create();
    $node = Node::factory()->create([
        'daemon_port' => 2800,
        'daemon_uuid' => '550e8400-e29b-41d4-a716-446655440000',
        'fqdn' => 'node.example.com',
        'location_id' => $location->id,
        'use_ssl' => true,
    ]);
    $cargo = Cargo::factory()->create([
        'docker_images' => [
            'Java 21' => 'ghcr.io/skyportsh/yolks:java_21',
            'Java 17' => 'ghcr.io/skyportsh/yolks:java_17',
        ],
    ]);

    NodeCredential::factory()->create([
        'daemon_callback_token' => 'callback-token',
        'node_id' => $node->id,
    ]);

    $user = User::factory()->create();
    $server = Server::factory()->create([
        'allocation_id' => Allocation::factory()->create([
            'bind_ip' => '203.0.113.10',
            'ip_alias' => 'play.example.test',
            'node_id' => $node->id,
            'port' => 25565,
        ])->id,
        'cargo_id' => $cargo->id,
        'docker_image' => null,
        'name' => 'Alpha',
        'node_id' => $node->id,
        'status' => 'offline',
        'user_id' => $user->id,
    ]);

    return [
        'cargo' => $cargo,
        'server' => $server,
        'user' => $user,
    ];
}

test('server owner can view the settings page', function () {
    $dependencies = serverSettingsDependencies();

    actingAs($dependencies['user']);

    get("/server/{$dependencies['server']->id}/settings")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('server/settings')
            ->where('server.id', $dependencies['server']->id)
            ->where('server.name', 'Alpha')
            ->where('server.cargo.name', $dependencies['cargo']->name)
            ->where('server.effective_docker_image', 'ghcr.io/skyportsh/yolks:java_21')
            ->where('server.effective_docker_image_label', 'Java 21')
            ->has('server.cargo.docker_images', 2)
            ->where('server.cargo.docker_images.0.label', 'Java 21'));
});

test('admin can view the settings page for any server', function () {
    $dependencies = serverSettingsDependencies();

    actingAs(User::factory()->create(['is_admin' => true]));

    get("/server/{$dependencies['server']->id}/settings")->assertOk();
});

test('other users cannot view the settings page', function () {
    $dependencies = serverSettingsDependencies();

    actingAs(User::factory()->create());

    get("/server/{$dependencies['server']->id}/settings")->assertForbidden();
});

test('server owner can update the server name', function () {
    Http::fake([
        'https://node.example.com:2800/api/daemon/servers/sync' => Http::response([
            'ok' => true,
        ]),
    ]);

    $dependencies = serverSettingsDependencies();

    actingAs($dependencies['user']);

    patch("/server/{$dependencies['server']->id}/settings/general", [
        'name' => 'Alpha Prime',
    ])
        ->assertRedirect()
        ->assertSessionHas(
            'success',
            'Server settings updated. skyportd saved the new server state.',
        );

    $dependencies['server']->refresh();

    expect($dependencies['server']->name)->toBe('Alpha Prime');

    Http::assertSent(fn ($request) => $request->url() === 'https://node.example.com:2800/api/daemon/servers/sync'
        && $request->hasHeader('Authorization', 'Bearer callback-token')
        && $request['server']['id'] === $dependencies['server']->id
        && $request['server']['name'] === 'Alpha Prime');
});

test('server owner can queue a new docker image for the next restart', function () {
    Http::fake([
        'https://node.example.com:2800/api/daemon/servers/sync' => Http::response([
            'ok' => true,
        ]),
    ]);

    $dependencies = serverSettingsDependencies();

    actingAs($dependencies['user']);

    patch("/server/{$dependencies['server']->id}/settings/startup", [
        'docker_image' => 'ghcr.io/skyportsh/yolks:java_17',
    ])
        ->assertRedirect()
        ->assertSessionHas(
            'success',
            'Startup settings updated. The new Docker image is queued for the next restart.',
        );

    $dependencies['server']->refresh();

    expect($dependencies['server']->docker_image)
        ->toBe('ghcr.io/skyportsh/yolks:java_17');

    Http::assertSent(fn ($request) => $request->url() === 'https://node.example.com:2800/api/daemon/servers/sync'
        && $request['server']['id'] === $dependencies['server']->id
        && $request['server']['docker_image'] === 'ghcr.io/skyportsh/yolks:java_17');
});

test('startup settings reject docker images outside the cargo definition', function () {
    Http::fake();

    $dependencies = serverSettingsDependencies();

    actingAs($dependencies['user']);

    patch("/server/{$dependencies['server']->id}/settings/startup", [
        'docker_image' => 'ghcr.io/skyportsh/yolks:not-allowed',
    ])
        ->assertSessionHasErrors([
            'docker_image' => 'Please choose a valid Docker image for this cargo.',
        ]);

    Http::assertNothingSent();
});
