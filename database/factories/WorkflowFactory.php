<?php

namespace Database\Factories;

use App\Models\Server;
use App\Models\Workflow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workflow>
 */
class WorkflowFactory extends Factory
{
    public function definition(): array
    {
        return [
            'server_id' => Server::factory(),
            'name' => fake()->words(2, true),
            'enabled' => true,
            'nodes' => [],
            'edges' => [],
        ];
    }
}
