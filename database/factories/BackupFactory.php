<?php

namespace Database\Factories;

use App\Models\Backup;
use App\Models\Server;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Backup>
 */
class BackupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'server_id' => Server::factory(),
            'name' => fake()->words(3, true),
            'uuid' => Str::uuid()->toString(),
            'size_bytes' => fake()->numberBetween(1024, 1024 * 1024 * 500),
            'status' => 'completed',
            'completed_at' => now(),
        ];
    }
}
