<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    private const ALLOWED_PREFIXES = ['assets/', 'profile-photos/'];

    public function show(string $path)
    {
        $path = urldecode($path);

        if (! $this->isAllowed($path)) {
            return abort(404);
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            return abort(404);
        }

        return $disk->response($path, null, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    private function isAllowed(string $path): bool
    {
        foreach (self::ALLOWED_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
