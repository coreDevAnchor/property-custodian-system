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

        $monthlyUsage = $this->monthlyUsageSeries($usageMetric, $selectedCategory);
        $borrowerAnalytics = $this->borrowerAnalytics();
        $depreciationSummary = $this->depreciationSummary();
        $reportSummary = $this->reportSummary();

        $sharedReportData = [
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'selectedSort' => $sort,
            'selectedView' => $view,
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
        string $selectedCategory
    ): array {
        $start = now()
            ->subMonths(11)
            ->startOfMonth();

        if ($metric === 'assets_added') {
            $monthExpression = match (DB::connection()->getDriverName()) {
                'pgsql' => "TO_CHAR(created_at, 'YYYY-MM')",
                'sqlite' => "strftime('%Y-%m', created_at)",
                default => "DATE_FORMAT(created_at, '%Y-%m')",
            };

            $query = Asset::query()
                ->where('created_at', '>=', $start);

            if ($selectedCategory !== 'all') {
                $query->where(
                    'category_id',
                    $selectedCategory
                );
            }

            /*
             * We group assets by the month they were added,
             * then count their current condition/status.
             */
            $rows = $query
                ->selectRaw("
                {$monthExpression} as month,
                condition,
                status,
                COUNT(*) as count
            ")
                ->groupBy(
                    'month',
                    'condition',
                    'status'
                )
                ->get();

            $grouped = [];

            foreach ($rows as $row) {
                $month = $row->month;

                if (!isset($grouped[$month])) {
                    $grouped[$month] = [
                        'good' => 0,
                        'defective' => 0,
                        'lost' => 0,
                    ];
                }

                /*
                 * Good assets:
                 * condition 3
                 *
                 * Defective assets:
                 * currently under repair
                 *
                 * Lost assets:
                 * status lost
                 */
                if ($row->status === 'lost') {
                    $grouped[$month]['lost'] += (int) $row->count;
                } elseif ($row->status === 'under_repair') {
                    $grouped[$month]['defective'] += (int) $row->count;
                } elseif ((int) $row->condition === 3) {
                    $grouped[$month]['good'] += (int) $row->count;
                }
            }

            return collect(range(0, 11))
                ->map(function (int $offset) use ($start, $grouped) {
                    $month = $start
                        ->copy()
                        ->addMonths($offset);

                    $key = $month->format('Y-m');

                    $good = $grouped[$key]['good'] ?? 0;
                    $defective = $grouped[$key]['defective'] ?? 0;
                    $lost = $grouped[$key]['lost'] ?? 0;

                    return [
                        'month' => $key,
                        'label' => $month->format('M'),

                        'count' =>
                            $good +
                            $defective +
                            $lost,

                        'good' => $good,
                        'defective' => $defective,
                        'lost' => $lost,
                    ];
                })
                ->all();
        }

        /*
         * BORROW REQUESTS
         */

        $monthExpression = match (DB::connection()->getDriverName()) {
            'pgsql' => "TO_CHAR(requested_at, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', requested_at)",
            default => "DATE_FORMAT(requested_at, '%Y-%m')",
        };

        $query = BorrowRequest::query()
            ->whereNotNull('requested_at')
            ->where('requested_at', '>=', $start);

        if ($selectedCategory !== 'all') {
            $query->whereHas(
                'asset',
                fn($q) => $q->where(
                    'category_id',
                    $selectedCategory
                )
            );
        }

        $rows = $query
            ->selectRaw("
            {$monthExpression} as month,
            status,
            COUNT(*) as count
        ")
            ->groupBy(
                'month',
                'status'
            )
            ->get();

        $grouped = [];

        foreach ($rows as $row) {
            $grouped[$row->month][$row->status] =
                (int) $row->count;
        }

        return collect(range(0, 11))
            ->map(function (int $offset) use ($start, $grouped) {
                $month = $start
                    ->copy()
                    ->addMonths($offset);

                $key = $month->format('Y-m');

                $pending =
                    $grouped[$key]['pending'] ?? 0;

                $returned =
                    $grouped[$key]['returned'] ?? 0;

                $rejected =
                    $grouped[$key]['rejected'] ?? 0;

                return [
                    'month' => $key,
                    'label' => $month->format('M'),

                    'count' =>
                        $pending +
                        $returned +
                        $rejected,

                    'pending' => $pending,
                    'returned' => $returned,
                    'rejected' => $rejected,
                ];
            })
            ->all();
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
    private function reportSummary(): array
    {
        $totalBorrowRequests = BorrowRequest::count();
        $approvedBorrows = BorrowRequest::whereNotNull('approved_at')->count();
        $returnedBorrows = BorrowRequest::where('status', 'returned')->count();

        $returnConditions = [
            'ok' => BorrowRequest::where('return_condition', 'ok')->count(),
            'defective' => BorrowRequest::where('return_condition', 'defective')->count(),
            'lost' => BorrowRequest::where('return_condition', 'lost')->count(),
        ];

        $conditionCounts = Asset::query()
            ->selectRaw('condition, COUNT(*) as count')
            ->groupBy('condition')
            ->pluck('count', 'condition');

        $assetConditions = [
            'excellent' => (int) ($conditionCounts[4] ?? 0),
            'good' => (int) ($conditionCounts[3] ?? 0),
            'fair' => (int) ($conditionCounts[2] ?? 0),
            'poor' => (int) ($conditionCounts[1] ?? 0),
        ];

        return [
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