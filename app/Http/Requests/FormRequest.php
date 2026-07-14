<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest as BaseFormRequest;

abstract class FormRequest extends BaseFormRequest
{
    public function user($guard = null): ?User
    {
        $user = parent::user($guard);

        return $user instanceof User ? $user : null;
    }
}
