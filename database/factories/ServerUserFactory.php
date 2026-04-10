<?php

namespace Database\Factories;

use App\Models\Server;
use App\Models\ServerUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServerUser>
 */
class ServerUserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'server_id' => Server::factory(),
            'user_id' => User::factory(),
            'permissions' => ServerUser::availablePermissions(),
        ];
    }
}
