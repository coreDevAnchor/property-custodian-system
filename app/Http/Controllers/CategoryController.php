<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'prefix' => ['required', 'string', 'max:50', 'unique:categories,prefix'],
            'description' => ['nullable', 'string'],
            'unit_type' => ['required', 'in:single,multi'],
        ]);

        $category = Category::create($validated);

        return response()->json($category);
    }

    public function check(Category $category): JsonResponse
    {
        return response()->json([
            'assets' => $category->assets()
                ->get(['id', 'name', 'asset_tag']),
            'asset_types' => $category->assetTypes()
                ->get(['id', 'name']),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(['ok' => true]);
    }
}
