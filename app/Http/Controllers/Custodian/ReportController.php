<?php

namespace App\Http\Controllers\Custodian;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $view = $request->get('view', 'assets');
        $selectedCategory = $request->get('category', 'all');
        $sort = $request->get('sort', $view === 'overdue' ? 'most_overdue' : 'latest');
        $perPage = (int) $request->get('per_page', 15);

        $categories = Category::all(['id', 'name'])
            ->sortBy('name')
            ->values();

        // Always-accurate overdue count for the stat card, independent of
        // which tab/filter/page is currently active.
        $overdueCount = BorrowRequest::where('status', 'borrowed')
            ->whereNotNull('expected_return_date')
            ->whereDate('expected_return_date', '<', now())
            ->count();

        if ($view === 'overdue') {
            $query = BorrowRequest::with([
                'asset.category:id,name',
                'employee.user:id,name',
            ])
                ->where('status', 'borrowed')
                ->whereNotNull('expected_return_date')
                ->whereDate('expected_return_date', '<', now());

            if ($selectedCategory !== 'all') {
                $query->whereHas('asset', fn($q) => $q->where('category_id', $selectedCategory));
            }

            match ($sort) {
                'least_overdue' => $query->orderByDesc('expected_return_date'),
                'borrower_az' => $query->join('employees', 'employees.id', '=', 'borrow_requests.employee_id')
                    ->join('users', 'users.id', '=', 'employees.user_id')
                    ->orderBy('users.name', 'asc')
                    ->select('borrow_requests.*'),
                'borrower_za' => $query->join('employees', 'employees.id', '=', 'borrow_requests.employee_id')
                    ->join('users', 'users.id', '=', 'employees.user_id')
                    ->orderBy('users.name', 'desc')
                    ->select('borrow_requests.*'),
                default => $query->orderBy('expected_return_date'), // most_overdue = earliest due date first
            };

            $overdueItems = $query
                ->paginate($perPage)
                ->through(function ($borrow) {
                    $daysOverdue = now()->startOfDay()
                        ->diffInDays(\Carbon\Carbon::parse($borrow->expected_return_date)->startOfDay());

                    return [
                        'id' => $borrow->id,
                        'borrower' => $borrow->employee?->user?->name,
                        'asset_name' => $borrow->asset?->name,
                        'asset_tag' => $borrow->asset?->asset_tag,
                        'category' => $borrow->asset?->category?->name,
                        'expected_return_date' => $borrow->expected_return_date,
                        'days_overdue' => $daysOverdue,
                    ];
                });

            return Inertia::render('custodian/reports', [
                'categories' => $categories,
                'selectedCategory' => $selectedCategory,
                'selectedSort' => $sort,
                'selectedView' => $view,
                'overdueCount' => $overdueCount,
                'assets' => null,
                'overdueItems' => $overdueItems,
            ]);
        }

        $query = Asset::with([
            'category:id,name',
            'assetType:id,name',
        ]);

        if ($selectedCategory !== 'all') {
            $query->where('category_id', $selectedCategory);
        }

        match ($sort) {
            'oldest' => $query->oldest(),
            'name_asc' => $query->orderBy('name'),
            'name_desc' => $query->orderByDesc('name'),
            'cost_high' => $query->orderByDesc('acquisition_cost'),
            'cost_low' => $query->orderBy('acquisition_cost'),
            default => $query->latest(),
        };

        $assets = $query
            ->paginate($perPage)
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
            'selectedView' => $view,
            'overdueCount' => $overdueCount,
            'assets' => $assets,
            'overdueItems' => null,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $view = $request->get('view', 'assets');
        $selectedCategory = $request->get('category', 'all');
        $sort = $request->get('sort', 'latest');

        if ($view === 'overdue') {
            $query = BorrowRequest::with(['asset.category:id,name', 'employee.user:id,name'])
                ->where('status', 'borrowed')
                ->whereNotNull('expected_return_date')
                ->whereDate('expected_return_date', '<', now());

            if ($selectedCategory !== 'all') {
                $query->whereHas('asset', fn($q) => $q->where('category_id', $selectedCategory));
            }

            $items = $query->orderBy('expected_return_date')->get();

            return response()->streamDownload(function () use ($items) {
                $handle = fopen('php://output', 'w');
                fputcsv($handle, ['Borrower', 'Asset', 'Asset Tag', 'Category', 'Expected Return Date', 'Days Overdue']);

                foreach ($items as $borrow) {
                    $daysOverdue = now()->startOfDay()
                        ->diffInDays(\Carbon\Carbon::parse($borrow->expected_return_date)->startOfDay());

                    fputcsv($handle, [
                        $borrow->employee?->user?->name,
                        $borrow->asset?->name,
                        $borrow->asset?->asset_tag,
                        $borrow->asset?->category?->name,
                        $borrow->expected_return_date,
                        $daysOverdue,
                    ]);
                }

                fclose($handle);
            }, 'overdue_assets_' . now()->format('Y-m-d') . '.csv');
        }

        $query = Asset::with([
            'category:id,name',
            'assetType:id,name',
        ]);

        if ($selectedCategory !== 'all') {
            $query->where('category_id', $selectedCategory);
        }

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