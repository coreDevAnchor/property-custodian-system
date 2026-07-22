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

        $assets = Asset::with(['category', 'assetType', 'location'])
            ->where('status', 'available')
            ->when($search, function ($query) use ($search) {
                $searchPattern = '%' . mb_strtolower($search) . '%';

                $query->where(function ($q) use ($searchPattern) {
                    $q->whereRaw('LOWER(name) LIKE ?', [$searchPattern])
                        ->orWhereRaw('LOWER(asset_tag) LIKE ?', [$searchPattern])
                        ->orWhereHas('category', fn ($category) => $category->whereRaw('LOWER(name) LIKE ?', [$searchPattern]))
                        ->orWhereHas('assetType', fn ($assetType) => $assetType->whereRaw('LOWER(name) LIKE ?', [$searchPattern]));
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
