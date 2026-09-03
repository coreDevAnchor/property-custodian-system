<?php

namespace App\Http\Controllers;

use App\Models\AssetType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssetTypeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('asset_types', 'name')
                    ->where('category_id', $request->input('category_id')),
            ],
            'prefix' => ['required', 'string', 'max:50'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
        ], [
            'name.unique' => 'An asset type with this name already exists in this category.',
        ]);

        $validated['prefix'] = $this->uniquePrefix(strtoupper(trim($validated['prefix'])));

        $assetType = AssetType::create($validated);

        return response()->json($assetType->load('category'));
    }

    private function uniquePrefix(string $base): string
    {
        $candidate = $base;
        $suffix = 1;

        while (AssetType::where('prefix', $candidate)->exists()) {
            $candidate = $base.sprintf('%02d', ++$suffix);
        }

        return $candidate;
    }

    public function check(AssetType $assetType): JsonResponse
    {
        return response()->json([
            'assets' => $assetType->assets()
                ->get(['id', 'name', 'asset_tag']),
        ]);
    }

    public function destroy(AssetType $assetType): JsonResponse
    {
        $assetType->delete();

        return response()->json(['ok' => true]);
    }
}
