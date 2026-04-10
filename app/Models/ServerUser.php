<?php

namespace App\Models;

use Database\Factories\ServerUserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['server_id', 'user_id', 'permissions'])]
class ServerUser extends Model
{
    /** @use HasFactory<ServerUserFactory> */
    use HasFactory;

    public const PERMISSION_CONSOLE = 'console';

    public const PERMISSION_FILES = 'files';

    public const PERMISSION_POWER = 'power';

    public const PERMISSION_SETTINGS = 'settings';

    public const PERMISSION_ALLOCATIONS = 'allocations';

    public const PERMISSION_FIREWALL = 'firewall';

    public const PERMISSION_USERS = 'users';

    /**
     * @return list<string>
     */
    public static function availablePermissions(): array
    {
        return [
            self::PERMISSION_CONSOLE,
            self::PERMISSION_FILES,
            self::PERMISSION_POWER,
            self::PERMISSION_SETTINGS,
            self::PERMISSION_ALLOCATIONS,
            self::PERMISSION_FIREWALL,
            self::PERMISSION_USERS,
        ];
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return list<string>
     */
    public function permissionList(): array
    {
        $permissions = $this->permissions;

        if (is_string($permissions)) {
            $permissions = json_decode($permissions, true);
        }

        return is_array($permissions) ? array_values($permissions) : [];
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissionList(), true);
    }

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
        ];
    }
}
