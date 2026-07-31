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
        $usageMetric = $request->get('usage_metric', 'borrows'); // 'borrows' | 'assets_added'
        $chartPeriod = $request->get('chart_period', 'month');
        $employeePeriod = $request->get('employee_period', 'month');
        $headerPeriod = $request->get('header_period', 'month');
        $valuationPeriod = $request->get('valuation_period', 'month');

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

        $monthlyUsage = $this->monthlyUsageSeries($usageMetric, $selectedCategory, $chartPeriod);
        $borrowerAnalytics = $this->borrowerAnalytics($employeePeriod);
        $depreciationSummary = $this->depreciationSummary($valuationPeriod);
        $reportSummary = $this->reportSummary($headerPeriod);

        $sharedReportData = [
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'selectedSort' => $sort,
            'selectedView' => $view,
            'selectedHeaderPeriod' => $headerPeriod,
            'selectedChartPeriod' => $chartPeriod,
            'selectedEmployeePeriod' => $employeePeriod,
            'selectedValuationPeriod' => $valuationPeriod,
            'usageMetric' => $usageMetric,

            'overdueCount' => $overdueCount,
            'lostCount' => $lostCount,

            'monthlyUsage' => $monthlyUsage,
            'borrowerAnalytics' => $borrowerAnalytics,
            'depreciationSummary' => $depreciationSummary,
            'reportSummary' => $reportSummary,

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
     * Monthly usage data for the report chart.
     *
     * Borrows:
     * - pending  = current status is pending
     * - returned = current status is returned
     * - rejected = current status is rejected
     *
     * Assets:
     * - good      = condition 3
     * - defective = currently under repair
     * - lost      = status lost
     */
    private function monthlyUsageSeries(
        string $metric,
        string $selectedCategory,
        string $period,
    ): array {

        $driver = DB::connection()->getDriverName();

        switch ($period) {

            case 'today':
                $start = now()->startOfDay();
                $slots = collect(range(0, 23));

                $dateExpression = match ($driver) {
                    'pgsql' => "EXTRACT(HOUR FROM %s)",
                    'sqlite' => "strftime('%H', %s)",
                    default => "HOUR(%s)",
                };

                $label = fn($i) => sprintf('%02d:00', $i);
                $key = fn($i) => (string) $i;
                break;

            case 'week':
                $start = now()->startOfWeek();

                $slots = collect(range(0, 6));

                $dateExpression = match ($driver) {
                    'pgsql' => "EXTRACT(DOW FROM %s)",
                    'sqlite' => "strftime('%w', %s)",
                    default => "DAYOFWEEK(%s)",
                };

                $label = fn($i) =>
                    now()->startOfWeek()->copy()->addDays($i)->format('D');

                $key = fn($i) => (string) $i;
                break;

            case 'month':
                $start = now()->startOfMonth();

                $slots = collect(range(1, now()->daysInMonth));

                $dateExpression = match ($driver) {
                    'pgsql' => "EXTRACT(DAY FROM %s)",
                    'sqlite' => "strftime('%d', %s)",
                    default => "DAY(%s)",
                };

                $label = fn($i) => (string) $i;
                $key = fn($i) => (string) $i;
                break;

            default: // year

                $start = now()->startOfYear();

                $slots = collect(range(1, 12));

                $dateExpression = match ($driver) {
                    'pgsql' => "EXTRACT(MONTH FROM %s)",
                    'sqlite' => "strftime('%m', %s)",
                    default => "MONTH(%s)",
                };

                $label = fn($i) =>
                    now()->startOfYear()->copy()->addMonths($i - 1)->format('M');

                $key = fn($i) => (string) $i;
                break;
        }

        if ($metric === 'assets_added') {

            $query = Asset::query()
                ->where('created_at', '>=', $start);

            if ($selectedCategory !== 'all') {
                $query->where('category_id', $selectedCategory);
            }

            $rows = $query
                ->selectRaw(sprintf($dateExpression, 'created_at') . " as bucket,
                condition,
                status,
                COUNT(*) as count")
                ->groupBy('bucket', 'condition', 'status')
                ->get();

            $grouped = [];

            foreach ($rows as $row) {

                $bucket = (string) (int) $row->bucket;

                if (!isset($grouped[$bucket])) {
                    $grouped[$bucket] = [
                        'good' => 0,
                        'defective' => 0,
                        'lost' => 0,
                    ];
                }

                if ($row->status === 'lost') {
                    $grouped[$bucket]['lost'] += $row->count;
                } elseif ($row->status === 'under_repair') {
                    $grouped[$bucket]['defective'] += $row->count;
                } elseif ((int) $row->condition === 3) {
                    $grouped[$bucket]['good'] += $row->count;
                }
            }

            return $slots->map(function ($slot) use ($grouped, $label, $key) {

                $bucket = $key($slot);

                $good = $grouped[$bucket]['good'] ?? 0;
                $defective = $grouped[$bucket]['defective'] ?? 0;
                $lost = $grouped[$bucket]['lost'] ?? 0;

                return [

                    'month' => $bucket,

                    'label' => $label($slot),

                    'count' => $good + $defective + $lost,

                    'good' => $good,

                    'defective' => $defective,

                    'lost' => $lost,
                ];

            })->values()->all();
        }

        $query = BorrowRequest::query()
            ->whereNotNull('requested_at')
            ->where('requested_at', '>=', $start);

        if ($selectedCategory !== 'all') {
            $query->whereHas(
                'asset',
                fn($q) => $q->where('category_id', $selectedCategory)
            );
        }

        $rows = $query
            ->selectRaw(sprintf($dateExpression, 'requested_at') . " as bucket,
            status,
            COUNT(*) as count")
            ->groupBy('bucket', 'status')
            ->get();

        $grouped = [];

        foreach ($rows as $row) {

            $bucket = (string) (int) $row->bucket;

            $grouped[$bucket][$row->status] = (int) $row->count;
        }

        return $slots->map(function ($slot) use ($grouped, $label, $key) {

            $bucket = $key($slot);

            $pending = $grouped[$bucket]['pending'] ?? 0;
            $returned = $grouped[$bucket]['returned'] ?? 0;
            $rejected = $grouped[$bucket]['rejected'] ?? 0;

            return [

                'month' => $bucket,

                'label' => $label($slot),

                'count' => $pending + $returned + $rejected,

                'pending' => $pending,

                'returned' => $returned,

                'rejected' => $rejected,
            ];

        })->values()->all();
    }
    /**
     * Headline totals for the summary panel: overall borrow-request volume,
     * how much of it was approved/returned, the return-condition mix
     * (good/defective/lost), and the current inventory's condition mix
     * (excellent/good/fair/poor).
     *
     * NOTE: assets.condition is assumed 1=Poor, 2=Fair, 3=Good, 4=Excellent.
     * Flip the mapping below if your actual scale runs the other way.
     *
     * @return array{
     *     totalBorrowRequests: int,
     *     approvedBorrows: int,
     *     returnedBorrows: int,
     *     returnConditions: array{ok: int, defective: int, lost: int},
     *     assetConditions: array{excellent: int, good: int, fair: int, poor: int}
     * }
     */
    private function reportSummary(string $period): array
    {

        $start = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $totalBorrowRequests = BorrowRequest::where(
            'requested_at',
            '>=',
            $start
        )->count();

        $approvedBorrows = BorrowRequest::whereNotNull('approved_at')->where(
            'requested_at',
            '>=',
            $start
        )->count();

        $returnedBorrows = BorrowRequest::where('status', 'returned')->where(
            'requested_at',
            '>=',
            $start
        )->count();

        $returnConditions = [
            'ok' => BorrowRequest::where('return_condition', 'ok')
                ->where('returned_at', '>=', $start)
                ->count(),

            'defective' => BorrowRequest::where('return_condition', 'defective')
                ->where('returned_at', '>=', $start)
                ->count(),

            'lost' => BorrowRequest::where('return_condition', 'lost')
                ->where('returned_at', '>=', $start)
                ->count(),
        ];

        $conditionCounts = Asset::where(
            'created_at',
            '>=',
            $start
        )
            ->selectRaw('condition, COUNT(*) as count')
            ->groupBy('condition')
            ->pluck('count', 'condition');

        $assetConditions = [
            'excellent' => (int) ($conditionCounts[4] ?? 0),
            'good' => (int) ($conditionCounts[3] ?? 0),
            'fair' => (int) ($conditionCounts[2] ?? 0),
            'poor' => (int) ($conditionCounts[1] ?? 0),
        ];


        $totalAssets = Asset::where(
            'created_at',
            '>=',
            $start
        )->count();

        $overdueItems = BorrowRequest::where('status', 'borrowed')
            ->where('requested_at', '>=', $start)
            ->whereDate('expected_return_date', '<', now())
            ->count();

        $lostAssets = Asset::where('status', 'lost')
            ->where('updated_at', '>=', $start)
            ->count();

        $defectiveAssets = Asset::where(function ($q) {
            $q->where('status', 'defective')
                ->orWhere('status', 'under_repair');
        })
            ->where('updated_at', '>=', $start)
            ->count();

        $totalAssetValue = Asset::where(
            'created_at',
            '>=',
            $start
        )->sum('acquisition_cost');

        $totalDepreciation = Asset::where(
            'created_at',
            '>=',
            $start
        )->sum(
                DB::raw('acquisition_cost * depreciation_rate / 100')
            );

        $currentEstimatedValue =
            max($totalAssetValue - $totalDepreciation, 0);

        return [
            'totalAssets' => $totalAssets,
            'overdueItems' => $overdueItems,
            'lostAssets' => $lostAssets,
            'defectiveAssets' => $defectiveAssets,
            'totalAssetValue' => $totalAssetValue,
            'totalDepreciation' => $totalDepreciation,
            'currentEstimatedValue' => $currentEstimatedValue,
            'totalBorrowRequests' => $totalBorrowRequests,
            'approvedBorrows' => $approvedBorrows,
            'returnedBorrows' => $returnedBorrows,
            'returnConditions' => $returnConditions,
            'assetConditions' => $assetConditions,
        ];
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
    private function borrowerAnalytics(string $period): array
    {
        $start = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

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
            borrows.borrower_id,
            users.name as borrower,
            COUNT(*) as count
        ")
            ->groupBy(
                'borrows.borrower_id',
                'users.name'
            )
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return $results
            ->map(fn($item) => [
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
    private function depreciationSummary(string $period): array
    {

        $start = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $assets = Asset::query()
            ->where('created_at', '>=', $start)
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
            'currentEstimatedValue' => round($currentEstimatedValue, 2),
            'assetCount' => $assets->count(),
            'averageDepreciationRate' => round(
                $assets->avg('depreciation_rate') ?? 0,
                2
            ),
        ];
    }
}