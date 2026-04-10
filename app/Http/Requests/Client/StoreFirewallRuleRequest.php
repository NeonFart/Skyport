<?php

namespace App\Http\Requests\Client;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreFirewallRuleRequest extends FormRequest
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
            'direction' => ['required', 'in:inbound,outbound'],
            'action' => ['required', 'in:allow,deny'],
            'protocol' => ['required', 'in:tcp,udp,icmp'],
            'source' => ['required', 'string', 'max:45'],
            'port_start' => ['nullable', 'integer', 'between:1,65535'],
            'port_end' => ['nullable', 'integer', 'between:1,65535'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $protocol = $this->input('protocol');

                if ($protocol === 'icmp') {
                    return;
                }

                if (! $this->filled('port_start')) {
                    $validator->errors()->add('port_start', 'A port or port range is required for TCP and UDP rules.');
                }

                if ($this->filled('port_start') && $this->filled('port_end')) {
                    if ((int) $this->input('port_end') < (int) $this->input('port_start')) {
                        $validator->errors()->add('port_end', 'The end port must be greater than or equal to the start port.');
                    }
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'direction.required' => 'Please select a direction.',
            'action.required' => 'Please select an action.',
            'protocol.required' => 'Please select a protocol.',
            'source.required' => 'Please enter a source address.',
        ];
    }
}
