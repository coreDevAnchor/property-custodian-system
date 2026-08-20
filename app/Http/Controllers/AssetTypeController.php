<?php

namespace App\Http\Controllers;

use App\Models\AssetType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetTypeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'prefix' => ['required', 'string', 'max:50', 'unique:asset_types,prefix'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
        ]);

        $assetType = AssetType::create($validated);

        return response()->json($assetType->load('category'));
    }
}
