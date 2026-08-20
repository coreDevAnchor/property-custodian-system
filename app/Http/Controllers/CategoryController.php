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
        ]);

        $category = Category::create($validated);

        return response()->json($category);
    }
}
