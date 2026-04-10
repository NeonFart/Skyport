<?php

use App\Models\Allocation;
use App\Models\Cargo;
use App\Models\FirewallRule;
use App\Models\Location;
use App\Models\Node;
use App\Models\NodeCredential;
use App\Models\Server;
use App\Models\User;
use App\Services\ServerConfigurationService;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

function firewallTestDependencies(): array
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
    $allocation = Allocation::factory()->create(['node_id' => $node->id]);

    $server = Server::factory()->create([
        'allocation_id' => $allocation->id,
        'cargo_id' => $cargo->id,
        'name' => 'Alpha',
        'node_id' => $node->id,
        'status' => 'running',
        'user_id' => $user->id,
    ]);

    return [
        'server' => $server,
        'user' => $user,
    ];
}

test('server owner can view the firewall page', function () {
    $deps = firewallTestDependencies();

    actingAs($deps['user']);

    get("/server/{$deps['server']->id}/networking/firewall")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('server/networking/firewall')
            ->where('server.id', $deps['server']->id)
            ->has('rules', 0));
});

test('admin can view the firewall page for any server', function () {
    $deps = firewallTestDependencies();

    actingAs(User::factory()->create(['is_admin' => true]));

    get("/server/{$deps['server']->id}/networking/firewall")->assertOk();
});

test('other users cannot view the firewall page', function () {
    $deps = firewallTestDependencies();

    actingAs(User::factory()->create());

    get("/server/{$deps['server']->id}/networking/firewall")->assertForbidden();
});

test('server owner can create a firewall rule', function () {
    $deps = firewallTestDependencies();

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/networking/firewall", [
        'direction' => 'inbound',
        'action' => 'deny',
        'protocol' => 'tcp',
        'source' => '0.0.0.0/0',
        'port_start' => 22,
        'port_end' => 22,
        'notes' => 'Block SSH',
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Firewall rule created.');

    expect(FirewallRule::query()->where('server_id', $deps['server']->id)->count())->toBe(1);

    $rule = FirewallRule::query()->where('server_id', $deps['server']->id)->first();
    expect($rule->direction)->toBe('inbound');
    expect($rule->action)->toBe('deny');
    expect($rule->protocol)->toBe('tcp');
    expect($rule->port_start)->toBe(22);
    expect($rule->notes)->toBe('Block SSH');
});

test('server owner can create a port range rule', function () {
    $deps = firewallTestDependencies();

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/networking/firewall", [
        'direction' => 'outbound',
        'action' => 'allow',
        'protocol' => 'udp',
        'source' => '10.0.0.0/8',
        'port_start' => 8000,
        'port_end' => 9000,
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Firewall rule created.');

    $rule = FirewallRule::query()->where('server_id', $deps['server']->id)->first();
    expect($rule->port_start)->toBe(8000);
    expect($rule->port_end)->toBe(9000);
});

test('server owner can create an icmp rule without ports', function () {
    $deps = firewallTestDependencies();

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/networking/firewall", [
        'direction' => 'inbound',
        'action' => 'deny',
        'protocol' => 'icmp',
        'source' => '0.0.0.0/0',
    ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Firewall rule created.');
});

test('tcp and udp rules require a port', function () {
    $deps = firewallTestDependencies();

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/networking/firewall", [
        'direction' => 'inbound',
        'action' => 'deny',
        'protocol' => 'tcp',
        'source' => '0.0.0.0/0',
    ])->assertSessionHasErrors('port_start');
});

test('end port must be greater than or equal to start port', function () {
    $deps = firewallTestDependencies();

    actingAs($deps['user']);

    post("/server/{$deps['server']->id}/networking/firewall", [
        'direction' => 'inbound',
        'action' => 'deny',
        'protocol' => 'tcp',
        'source' => '0.0.0.0/0',
        'port_start' => 9000,
        'port_end' => 8000,
    ])->assertSessionHasErrors('port_end');
});

test('server owner can delete a firewall rule', function () {
    $deps = firewallTestDependencies();
    $rule = FirewallRule::factory()->create([
        'server_id' => $deps['server']->id,
    ]);

    actingAs($deps['user']);

    delete("/server/{$deps['server']->id}/networking/firewall/{$rule->id}")
        ->assertRedirect()
        ->assertSessionHas('success', 'Firewall rule deleted.');

    expect(FirewallRule::query()->find($rule->id))->toBeNull();
});

test('cannot delete a rule belonging to another server', function () {
    $deps = firewallTestDependencies();
    $otherRule = FirewallRule::factory()->create();

    actingAs($deps['user']);

    delete("/server/{$deps['server']->id}/networking/firewall/{$otherRule->id}")
        ->assertUnprocessable();
});

test('firewall rules are listed on the page', function () {
    $deps = firewallTestDependencies();

    FirewallRule::factory()->create([
        'server_id' => $deps['server']->id,
        'direction' => 'inbound',
        'action' => 'deny',
        'protocol' => 'tcp',
        'port_start' => 22,
    ]);

    FirewallRule::factory()->create([
        'server_id' => $deps['server']->id,
        'direction' => 'outbound',
        'action' => 'allow',
        'protocol' => 'udp',
        'port_start' => 53,
    ]);

    actingAs($deps['user']);

    get("/server/{$deps['server']->id}/networking/firewall")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('rules', 2));
});

test('firewall rules are included in server sync payload', function () {
    $deps = firewallTestDependencies();

    FirewallRule::factory()->create([
        'server_id' => $deps['server']->id,
        'direction' => 'inbound',
        'action' => 'deny',
        'protocol' => 'tcp',
        'source' => '0.0.0.0/0',
        'port_start' => 22,
        'port_end' => 22,
    ]);

    $service = app(ServerConfigurationService::class);
    $payload = $service->payload($deps['server']);

    expect($payload)->toHaveKey('firewall_rules');
    expect($payload['firewall_rules'])->toHaveCount(1);
    expect($payload['firewall_rules'][0]['protocol'])->toBe('tcp');
    expect($payload['firewall_rules'][0]['port_start'])->toBe(22);
});
