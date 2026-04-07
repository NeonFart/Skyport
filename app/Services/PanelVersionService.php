<?php

namespace App\Services;

use InvalidArgumentException;

class PanelVersionService
{
    public function current(): string
    {
        return (string) config('app.version');
    }

    public function commit(): string
    {
        return rescue(function (): string {
            $commit = trim((string) shell_exec(sprintf(
                'git -C %s rev-parse --short HEAD 2>/dev/null',
                escapeshellarg(base_path()),
            )));

            return $commit !== '' ? $commit : 'unknown';
        }, 'unknown', false);
    }

    public function ensureCompatible(string $daemonVersion): void
    {
        if ($daemonVersion === $this->current()) {
            return;
        }

        throw new InvalidArgumentException($this->incompatibleMessage());
    }

    public function incompatibleMessage(): string
    {
        return sprintf(
            "This version of skyportd isn't compatible with Skyport panel %s.",
            $this->current(),
        );
    }
}
