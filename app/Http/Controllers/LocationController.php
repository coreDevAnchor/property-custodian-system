<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:locations,name'],
            'description' => ['nullable', 'string'],
        ]);

        $location = Location::create($validated);

        return response()->json($location);
    }

    public function check(Location $location): JsonResponse
    {
        return response()->json([
            'assets' => $location->assets()
                ->get(['id', 'name', 'asset_tag']),
        ]);
    }

    public function destroy(Location $location): JsonResponse
    {
        $location->delete();

        return response()->json(['ok' => true]);
    }
}
