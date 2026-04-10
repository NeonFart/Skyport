<?php

namespace App\Http\Controllers\Client\Concerns;

use App\Models\Server;
use App\Models\ServerUser;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

trait AuthorizesServerAccess
{
    protected function authorizeServerAccess(
        Request $request,
        Server $server,
    ): void {
        $user = $request->user();

        abort_unless(
            $user?->is_admin ||
                $server->user_id === $user?->id ||
                ServerUser::query()
                    ->where('server_id', $server->id)
                    ->where('user_id', $user?->id)
                    ->exists(),
            Response::HTTP_FORBIDDEN,
        );
    }
}
