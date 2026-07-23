<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        if (
            $user->must_change_password &&
            !$request->routeIs('password.force.edit') &&
            !$request->routeIs('password.force.update') &&
            !$request->routeIs('logout')
        ) {
            return redirect()->route('password.force.edit');
        }

        return $next($request);
    }
}
