<?php

use App\Models\Location;
use App\Models\Node;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;
use function Pest\Laravel\post;

test('non-admin cannot access admin locations page', function () {
    $user = User::factory()->create(['is_admin' => false]);

    actingAs($user);

    get('/admin/locations')->assertForbidden();
});

test('admin can access locations page', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $location = Location::factory()->create();

    actingAs($admin);

    $response = get('/admin/locations')->assertOk();

    assertInertiaPage(
        $response,
        fn (Assert $page) => $page
            ->component('admin/locations')
            ->has('locations.data', 1)
            ->where('locations.data.0.name', $location->name)
            ->has('filters'),
    );
});

test('admin can search locations', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    Location::factory()->create(['name' => 'Frankfurt']);
    Location::factory()->create(['name' => 'London']);

    actingAs($admin);

    $response = get('/admin/locations?search=Frank')->assertOk();

    assertInertiaPage(
        $response,
        fn (Assert $page) => $page
            ->has('locations.data', 1)
            ->where('locations.data.0.name', 'Frankfurt'),
    );
});

test('admin locations page paginates results', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    foreach (range(1, 11) as $number) {
        Location::factory()->create([
            'name' => "Location {$number}",
            'updated_at' => now()->subMinutes(20 - $number),
        ]);
    }

    actingAs($admin);

    $response = get('/admin/locations?page=2')->assertOk();

    assertInertiaPage(
        $response,
        fn (Assert $page) => $page
            ->where('locations.current_page', 2)
            ->where('locations.last_page', 2)
            ->where('locations.total', 11)
            ->has('locations.data', 1)
            ->where('locations.data.0.name', 'Location 1'),
    );
});

test('admin can create a location', function () {
    $admin = User::factory()->create(['is_admin' => true]);

    actingAs($admin);

    post('/admin/locations', [
        'name' => 'Singapore',
        'country' => 'Singapore',
    ])->assertRedirect();

    $location = Location::query()->where('name', 'Singapore')->first();

    expect($location)->not->toBeNull();
    expect($location?->country)->toBe('Singapore');
});

test('admin can update a location', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $location = Location::factory()->create([
        'name' => 'Paris',
        'country' => 'France',
    ]);

    actingAs($admin);

    patch("/admin/locations/{$location->id}", [
        'name' => 'Paris Central',
        'country' => 'France',
    ])->assertRedirect();

    expect($location->fresh()->name)->toBe('Paris Central');
});

test('admin can delete a location and its nodes', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $location = Location::factory()->create();
    $node = Node::factory()->create(['location_id' => $location->id]);

    actingAs($admin);

    delete("/admin/locations/{$location->id}")->assertRedirect();

    expect(Location::query()->find($location->id))->toBeNull();
    expect(Node::query()->find($node->id))->toBeNull();
});

test('admin can bulk delete locations', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $locations = Location::factory()->count(2)->create();

    actingAs($admin);

    delete('/admin/locations/bulk-destroy', [
        'ids' => $locations->pluck('id')->all(),
    ])->assertRedirect();

    expect(
        Location::query()->whereIn('id', $locations->pluck('id'))->count(),
    )->toBe(0);
});
