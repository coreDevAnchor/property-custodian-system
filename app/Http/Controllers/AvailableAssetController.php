<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AvailableAssetController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $category = $request->input('category', 'All');
        $perPage = (int) $request->input('per_page', 10);

        $assets = Asset::with(['category', 'location'])
            ->where('status', 'available')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('asset_tag', 'like', "%{$search}%")
                        ->orWhereHas('category', fn($c) => $c->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($category !== 'All', fn($q) => $q->where('category_id', $category))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('employee/employee-assets', [
            'assets' => $assets,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'category' => $category,
                'per_page' => $perPage,
            ],
        ]);
    }
}