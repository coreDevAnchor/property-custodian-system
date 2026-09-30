<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Support\AssetAnalytics;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustodianDashboardController extends Controller
{
    public function __construct(
        private readonly AssetAnalytics $analytics,
    ) {}

    public function index(Request $request)
    {
        $totalAssets = Asset::count();

        $categoryBreakdown = Category::withCount('assets')
            ->orderByDesc('assets_count')
            ->get()
            ->map(fn ($category) => [
                'label' => $category->name,
                'count' => $category->assets_count,
            ]);

        return Inertia::render('custodian/dashboard', [
            'stats' => [
                'totalAssets' => $totalAssets,
                'availableAssets' => Asset::where('status', 'available')->count(),
                'borrowedOut' => Asset::where('status', 'borrowed')->count(),
                'pendingRequests' => BorrowRequest::where('status', 'pending')->count(),
                'awaitingReturns' => BorrowRequest::where('status', 'awaiting_check')->count(),
            ],

            'pendingRequests' => BorrowRequest::with(['asset.category', 'borrower'])
                ->where('status', 'pending')
                ->latest('requested_at')
                ->take(5)
                ->get(),

            'assetCategories' => [
                'total' => $totalAssets,
                'breakdown' => $categoryBreakdown,
            ],

            'assetDepartments' => $this->analytics->departmentBreakdown(),

            'depreciationGranularity' => $this->analytics->depreciationGranularity($request),
            'depreciationSeries' => $this->analytics->depreciationSeries($request),

            'recentActivity' => ActivityLogs::with(['asset', 'actor'])
                ->latest('created_at')
                ->take(5)
                ->get(),
        ]);
    }
}
