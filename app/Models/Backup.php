<?php

namespace App\Models;

use Database\Factories\BackupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[
    Fillable([
        'server_id',
        'name',
        'uuid',
        'size_bytes',
        'checksum',
        'status',
        'error',
        'completed_at',
    ]),
]
class Backup extends Model
{
    /** @use HasFactory<BackupFactory> */
    use HasFactory;

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'completed_at' => 'datetime',
        ];
    }
}
