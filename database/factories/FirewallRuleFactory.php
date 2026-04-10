<?php

namespace Database\Factories;

use App\Models\FirewallRule;
use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FirewallRule>
 */
class FirewallRuleFactory extends Factory
{
    public function definition(): array
    {
        $port = fake()->numberBetween(1, 65535);

        return [
            'server_id' => Server::factory(),
            'direction' => fake()->randomElement(['inbound', 'outbound']),
            'action' => fake()->randomElement(['allow', 'deny']),
            'protocol' => fake()->randomElement(['tcp', 'udp']),
            'source' => '0.0.0.0/0',
            'port_start' => $port,
            'port_end' => $port,
            'notes' => null,
        ];
    }
}
