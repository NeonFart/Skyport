<?php

namespace App\Models;

use Database\Factories\FirewallRuleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[
    Fillable([
        'server_id',
        'direction',
        'action',
        'protocol',
        'source',
        'port_start',
        'port_end',
        'notes',
    ]),
]
class FirewallRule extends Model
{
    /** @use HasFactory<FirewallRuleFactory> */
    use HasFactory;

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    protected function casts(): array
    {
        return [
            'port_start' => 'integer',
            'port_end' => 'integer',
        ];
    }
}
