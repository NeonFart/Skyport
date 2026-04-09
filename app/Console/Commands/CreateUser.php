<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateUser extends Command
{
    protected $signature = 'user:create
                            {--name= : The name of the user}
                            {--email= : The email address}
                            {--password= : The password}
                            {--admin : Grant administrator privileges}';

    protected $description = 'Create a new user account';

    public function handle(): int
    {
        $name = $this->option('name') ?? $this->ask('Name');
        $email = $this->option('email') ?? $this->ask('Email address');
        $password = $this->option('password') ?? $this->secret('Password');
        $isAdmin = $this->option('admin')
            || (! $this->option('no-interaction') && $this->confirm('Should this user be an administrator?', false));

        $validator = Validator::make(
            compact('name', 'email', 'password'),
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'is_admin' => $isAdmin,
        ]);

        $this->info("User {$user->name} <{$user->email}> created successfully.");

        if ($isAdmin) {
            $this->info('Administrator privileges granted.');
        }

        return self::SUCCESS;
    }
}
