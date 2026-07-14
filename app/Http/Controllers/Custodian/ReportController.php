<?php

namespace App\Http\Controllers\Custodian;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $selectedCategory = $request->get('category', 'all');
        $sort = $request->get('sort', 'latest');

        $categories = Category::all(['id', 'name'])
            ->sortBy('name')
            ->values();

        $query = Asset::with([
            'category:id,name',
            'assetType:id,name',
        ]);

        //Category Filter
        if ($selectedCategory !== 'all') {
            $query->where('category_id', $selectedCategory);
        }

        // Sorting
        match ($sort) {
            'oldest' => $query->oldest(),
            'name_asc' => $query->orderBy('name'),
            'name_desc' => $query->orderByDesc('name'),
            'cost_high' => $query->orderByDesc('acquisition_cost'),
            'cost_low' => $query->orderBy('acquisition_cost'),
            default => $query->latest(),
        };

        $assets = $query
            ->paginate(15)
            ->through(function ($asset) {
                return [
                    'id' => $asset->id,
                    'name' => $asset->name,
                    'asset_tag' => $asset->asset_tag,

                    'category' => [
                        'name' => $asset->category?->name,
                    ],

                    'asset_type' => [
                        'name' => $asset->assetType?->name,
                    ],

                    'acquisition_cost' => $asset->acquisition_cost,
                    'depreciation_rate' => $asset->depreciation_rate,

                    'total_depreciation' => $asset->depreciation_rate
                        ? $asset->acquisition_cost *
                        ($asset->depreciation_rate / 100)
                        : null,

                    'created_at' => $asset->created_at,
                ];
            });

        return Inertia::render('custodian/reports', [
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'selectedSort' => $sort,
            'assets' => $assets,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
                $selectedCategory = $request->get('category', 'all');
        $sort = $request->get('sort', 'latest');

        $query = Asset::with([
            'category:id,name',
            'assetType:id,name',
        ]);

        // Category Filter
        if ($selectedCategory !== 'all') {
            $query->where('category_id', $selectedCategory);
        }

        // Sorting
        match ($sort) {
            'oldest' => $query->oldest(),
            'name_asc' => $query->orderBy('name'),
            'name_desc' => $query->orderByDesc('name'),
            'cost_high' => $query->orderByDesc('acquisition_cost'),
            'cost_low' => $query->orderBy('acquisition_cost'),
            default => $query->latest(),
        };

        $assets = $query->get();

        return response()->streamDownload(function () use ($assets) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Asset Tag', 'Category', 'Asset Type', 'Acquisition Cost', 'Depreciation Rate', 'Total Depreciation', 'Created At']);

            foreach ($assets as $asset) {
                fputcsv($handle, [
                    $asset->id,
                    $asset->name,
                    $asset->asset_tag,
                    $asset->category?->name,
                    $asset->assetType?->name,
                    $asset->acquisition_cost,
                    $asset->depreciation_rate,
                    $asset->depreciation_rate
                        ? $asset->acquisition_cost * ($asset->depreciation_rate / 100)
                        : 0,
                    $asset->created_at?->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 'assets_report_' . now()->format('Y-m-d') . '.csv');
    }
}