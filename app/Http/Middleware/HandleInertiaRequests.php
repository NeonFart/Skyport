<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\AppSettingsService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => fn (): ?array => $this->sharedUser($request->user()),
            ],
            'flash' => [
                'info' => fn (): ?string => $request->session()->get('info'),
                'success' => fn (): ?string => $request
                    ->session()
                    ->get('success'),
                'warning' => fn (): ?string => $request
                    ->session()
                    ->get('warning'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') ||
                $request->cookie('sidebar_state') === 'true',
            'impersonating' => $request->session()->has('impersonator_id'),
            'announcement' => fn (): ?string => app(
                AppSettingsService::class,
            )->announcement(),
            'announcementType' => fn (): string => app(
                AppSettingsService::class,
            )->announcementType(),
            'announcementDismissable' => fn (): bool => app(
                AppSettingsService::class,
            )->announcementDismissable(),
            'announcementIcon' => fn (): string => app(
                AppSettingsService::class,
            )->announcementIcon(),
        ];
    }

    /**
     * @return array<string, bool|int|string|null>|null
     */
    protected function sharedUser(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'is_admin' => $user->is_admin,
            'suspended_at' => $user->suspended_at?->toIso8601String(),
            'two_factor_enabled' => $user->two_factor_secret !== null,
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }
}
