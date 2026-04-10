<?php

namespace App\Http\Requests\Daemon;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServerRuntimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'uuid' => ['required', 'uuid'],
            'version' => ['required', 'string', 'max:50'],
            'status' => [
                'nullable',
                'string',
                'in:installing,install_failed,offline,restarting,running,starting,stopping',
            ],
            'last_error' => ['nullable', 'string', 'max:65535'],
            'backup_id' => ['nullable', 'integer'],
            'backup_status' => ['nullable', 'string', 'in:completed,failed'],
            'backup_size_bytes' => ['nullable', 'integer', 'min:0'],
            'backup_error' => ['nullable', 'string', 'max:65535'],
        ];
    }
}
