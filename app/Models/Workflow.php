<?php

namespace App\Models;

use Database\Factories\WorkflowFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['server_id', 'name', 'enabled', 'nodes', 'edges'])]
class Workflow extends Model
{
    /** @use HasFactory<WorkflowFactory> */
    use HasFactory;

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'nodes' => 'array',
            'edges' => 'array',
        ];
    }
}
