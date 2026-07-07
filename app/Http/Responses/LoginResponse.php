<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        switch ($user->role) {
            case 'custodian':
                return redirect()->route('custodian.dashboard');

            case 'employee':
                return redirect()->route('employee.dashboard');

            default:
                abort(403);
        }
    }
}
