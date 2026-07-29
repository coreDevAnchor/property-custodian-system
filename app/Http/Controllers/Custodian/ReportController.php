<?php

namespace App\Http\Controllers\Custodian;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $lostCount = Asset::where('status', 'lost')->count();

        $monthlyUsage = $this->monthlyAssetUsage($selectedCategory);
        $borrowerAnalytics = $this->borrowerAnalytics();
        $depreciationSummary = $this->depreciationSummary();

        $sharedReportData = [
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'selectedSort' => $sort,
            'selectedView' => $view,

            'overdueCount' => $overdueCount,
            'lostCount' => $lostCount,

            'monthlyUsage' => $monthlyUsage,
            'borrowerAnalytics' => $borrowerAnalytics,
            'depreciationSummary' => $depreciationSummary,
        ];

        if ($view === 'overdue') {
            $query = BorrowRequest::with([
                'asset.category:id,name',
                'borrower:id,name',
            ])
                ->where('status', 'borrowed')
                ->whereNotNull('expected_return_date')
                ->whereDate('expected_return_date', '<', now());

            if ($selectedCategory !== 'all') {
                $query->whereHas('asset', fn($q) => $q->where('category_id', $selectedCategory));
            }

            match ($sort) {
                'least_overdue' => $query->orderByDesc('expected_return_date'),
                'borrower_az' => $query->join('users', 'users.id', '=', 'borrows.borrower_id')
                    ->orderBy('users.name', 'asc')
                    ->select('borrows.*'),
                'borrower_za' => $query->join('users', 'users.id', '=', 'borrows.borrower_id')
                    ->orderBy('users.name', 'desc')
                    ->select('borrows.*'),
                default => $query->orderBy('expected_return_date'), // most_overdue = earliest due date first
            };

            $overdueItems = $query
                ->paginate($perPage)
                ->through(function ($borrow) {
                    $daysOverdue = now()->startOfDay()
                        ->diffInDays(\Carbon\Carbon::parse($borrow->expected_return_date)->startOfDay());

                    return [
                        'id' => $borrow->id,
                        'borrower' => $borrow->borrower?->name,
                        'asset_name' => $borrow->asset?->name,
                        'asset_tag' => $borrow->asset?->asset_tag,
                        'category' => $borrow->asset?->category?->name,
                        'expected_return_date' => $borrow->expected_return_date,
                        'days_overdue' => $daysOverdue,
                    ];
                });

            return Inertia::render('custodian/reports', [
                ...$sharedReportData,

                'assets' => null,
                'overdueItems' => $overdueItems,
                'lostItems' => null,
            ]);
        }

        if ($view === 'lost') {
            $query = Asset::with(['category:id,name', 'assetType:id,name'])
                ->where('status', 'lost');

            if ($selectedCategory !== 'all') {
                $query->where('category_id', $selectedCategory);
            }

            match ($sort) {
                'oldest' => $query->oldest(),
                'name_asc' => $query->orderBy('name'),
                'name_desc' => $query->orderByDesc('name'),
                default => $query->latest(),
            };

            $lostItems = $query
                ->paginate($perPage)
                ->through(fn($asset) => [
                    'id' => $asset->id,
                    'name' => $asset->name,
                    'asset_tag' => $asset->asset_tag,
                    'category' => $asset->category?->name,
                    'asset_type' => $asset->assetType?->name,
                    'reported_at' => $asset->updated_at,
                ]);

            return Inertia::render('custodian/reports', [
                ...$sharedReportData,

                'assets' => null,
                'overdueItems' => null,
                'lostItems' => $lostItems,
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
            ...$sharedReportData,

            'assets' => $assets,
            'overdueItems' => null,
            'lostItems' => null,
        ]);
    }

    /**
     * @return array<int, array{month: string, label: string, count: int}>
     */
    private function monthlyAssetUsage(string $selectedCategory): array
    {
        $start = now()->subMonths(11)->startOfMonth();

        $monthExpression = match (DB::connection()->getDriverName()) {
            'pgsql' => "TO_CHAR(approved_at, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', approved_at)",
            default => "DATE_FORMAT(approved_at, '%Y-%m')",
        };

        $query = BorrowRequest::query()
            ->whereNotNull('approved_at')
            ->where('approved_at', '>=', $start);

        if ($selectedCategory !== 'all') {
            $query->whereHas('asset', fn($q) => $q->where('category_id', $selectedCategory));
        }

        $counts = $query
            ->selectRaw("{$monthExpression} as month, COUNT(*) as count")
            ->groupBy('month')
            ->pluck('count', 'month');

        return collect(range(0, 11))
            ->map(function (int $offset) use ($start, $counts) {
                $month = $start->copy()->addMonths($offset);
                $key = $month->format('Y-m');

                return [
                    'month' => $key,
                    'label' => $month->format('M'),
                    'count' => (int) ($counts[$key] ?? 0),
                ];
            })
            ->all();
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $view = $request->get('view', 'assets');
        $selectedCategory = $request->get('category', 'all');
        $sort = $request->get('sort', 'latest');

        if ($view === 'overdue') {
            $query = BorrowRequest::with(['asset.category:id,name', 'borrower:id,name'])
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
                        $borrow->borrower?->name,
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

        if ($view === 'lost') {
            $query = Asset::with(['category:id,name', 'assetType:id,name'])
                ->where('status', 'lost');

            if ($selectedCategory !== 'all') {
                $query->where('category_id', $selectedCategory);
            }

            match ($sort) {
                'oldest' => $query->oldest(),
                'name_asc' => $query->orderBy('name'),
                'name_desc' => $query->orderByDesc('name'),
                default => $query->latest(),
            };

            $items = $query->get();

            return response()->streamDownload(function () use ($items) {
                $handle = fopen('php://output', 'w');
                fputcsv($handle, ['Asset', 'Asset Tag', 'Category', 'Asset Type', 'Reported Lost At']);

                foreach ($items as $asset) {
                    fputcsv($handle, [
                        $asset->name,
                        $asset->asset_tag,
                        $asset->category?->name,
                        $asset->assetType?->name,
                        $asset->updated_at,
                    ]);
                }

                fclose($handle);
            }, 'lost_assets_' . now()->format('Y-m-d') . '.csv');
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

    /**
     * @return array{
     *     borrowers: array<int, array{
     *         month: string,
     *         label: string,
     *         borrower_id: int,
     *         borrower: string,
     *         count: int
     *     }>,
     *     returners: array<int, array{
     *         month: string,
     *         label: string,
     *         borrower_id: int,
     *         borrower: string,
     *         count: int
     *     }>,
     *     onTimeReturners: array<int, array{
     *         month: string,
     *         label: string,
     *         borrower_id: int,
     *         borrower: string,
     *         count: int
     *     }>,
     *     defectiveReturns: array<int, array{
     *         month: string,
     *         label: string,
     *         borrower_id: int,
     *         borrower: string,
     *         count: int
     *     }>,
     *     lostItems: array<int, array{
     *         month: string,
     *         label: string,
     *         borrower_id: int,
     *         borrower: string,
     *         count: int
     *     }>
     * }
     */
    private function borrowerAnalytics(): array
    {
        $start = now()
            ->subMonths(11)
            ->startOfMonth();

        $monthExpression = match (
        DB::connection()->getDriverName()
        ) {
            'pgsql' => "TO_CHAR(%s, 'YYYY-MM')",
            'sqlite' => "strftime('%%Y-%%m', %s)",
            default => "DATE_FORMAT(%s, '%%Y-%%m')",
        };

        $borrowers = $this->groupBorrowerActivity(
            sprintf($monthExpression, 'approved_at'),
            $start,
            'approved_at'
        );

        $returners = $this->groupBorrowerActivity(
            sprintf($monthExpression, 'returned_at'),
            $start,
            'returned_at'
        );

        $onTimeReturners = $this->groupBorrowerActivity(
            sprintf($monthExpression, 'returned_at'),
            $start,
            'returned_at',
            fn($query) => $query
                ->whereNotNull('expected_return_date')
                ->whereColumn(
                    'returned_at',
                    '<=',
                    'expected_return_date'
                )
        );

        $defectiveReturns = $this->groupBorrowerActivity(
            sprintf($monthExpression, 'returned_at'),
            $start,
            'returned_at',
            fn($query) => $query
                ->where('return_condition', 'defective')
        );

        $lostItems = $this->groupBorrowerActivity(
            sprintf($monthExpression, 'returned_at'),
            $start,
            'returned_at',
            fn($query) => $query
                ->where('return_condition', 'lost')
        );

        return [
            'borrowers' => $borrowers,
            'returners' => $returners,
            'onTimeReturners' => $onTimeReturners,
            'defectiveReturns' => $defectiveReturns,
            'lostItems' => $lostItems,
        ];
    }

    private function groupBorrowerActivity(
        string $monthExpression,
        $start,
        string $dateColumn,
        ?callable $additionalFilter = null
    ): array {
        $query = BorrowRequest::query()
            ->join(
                'users',
                'users.id',
                '=',
                'borrows.borrower_id'
            )
            ->whereNotNull($dateColumn)
            ->where($dateColumn, '>=', $start);

        if ($additionalFilter) {
            $additionalFilter($query);
        }

        $results = $query
            ->selectRaw("
            {$monthExpression} as month,
            borrows.borrower_id,
            users.name as borrower,
            COUNT(*) as count
        ")
            ->groupBy(
                'month',
                'borrows.borrower_id',
                'users.name'
            )
            ->orderBy('month')
            ->orderByDesc('count')
            ->get();

        return $results
            ->map(fn($item) => [
                'month' => $item->month,
                'label' => \Carbon\Carbon::createFromFormat(
                    'Y-m',
                    $item->month
                )->format('M'),
                'borrower_id' => (int) $item->borrower_id,
                'borrower' => $item->borrower,
                'count' => (int) $item->count,
            ])
            ->all();
    }

    /**
     * @return array{
     *     totalAssetValue: float,
     *     totalDepreciation: float,
     *     currentEstimatedValue: float,
     *     assetCount: int
     * }
     */
    private function depreciationSummary(): array
    {
        $assets = Asset::query()
            ->select([
                'acquisition_cost',
                'depreciation_rate',
            ])
            ->get();

        $totalAssetValue = $assets->sum(
            fn($asset) => (float) $asset->acquisition_cost
        );

        $totalDepreciation = $assets->sum(
            fn($asset) => $asset->depreciation_rate
            ? (float) $asset->acquisition_cost *
            ((float) $asset->depreciation_rate / 100)
            : 0
        );

        $currentEstimatedValue = max(
            $totalAssetValue - $totalDepreciation,
            0
        );

        return [
            'totalAssetValue' => round($totalAssetValue, 2),
            'totalDepreciation' => round($totalDepreciation, 2),
            'currentEstimatedValue' => round(
                $currentEstimatedValue,
                2
            ),
            'assetCount' => $assets->count(),
        ];
    }
}
