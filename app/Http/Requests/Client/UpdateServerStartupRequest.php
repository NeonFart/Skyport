<?php

namespace App\Http\Requests\Client;

use App\Models\Server;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServerStartupRequest extends FormRequest
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
        /** @var Server $server */
        $server = $this->route('server');

        return [
            'docker_image' => [
                'required',
                'string',
                Rule::in(array_values($server->cargo->docker_images ?? [])),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'docker_image.required' => 'Please choose a Docker image.',
            'docker_image.in' => 'Please choose a valid Docker image for this cargo.',
        ];
    }
}
