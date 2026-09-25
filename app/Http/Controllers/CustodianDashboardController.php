<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustodianDashboardController extends Controller
{
    //
    public function index(Request $request)
    {
        $totalAssets = Asset::count();

        $categoryBreakdown = Category::withCount('assets')
            ->orderByDesc('assets_count')
            ->get()
            ->map(fn($category) => [
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

            'assetDepartments' => $this->departmentBreakdown(),

            'depreciationGranularity' => $this->depreciationGranularity($request),
            'depreciationSeries' => $this->depreciationSeries($request),

            'recentActivity' => ActivityLogs::with(['asset', 'actor'])
                ->latest('created_at')
                ->take(5)
                ->get(),
        ]);
    }

    private function departmentBreakdown(): array
    {
        $breakdown = BorrowRequest::query()
            ->where('status', 'borrowed')
            ->join('employees', 'employees.id', '=', 'borrows.employee_id')
            ->selectRaw('employees.department as label, COUNT(*) as count')
            ->groupBy('employees.department')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'count' => (int) $row->count,
            ])
            ->filter(fn ($row) => $row['label'] !== null)
            ->values();

        return [
            'total' => $breakdown->sum('count'),
            'breakdown' => $breakdown,
        ];
    }

    private function depreciationGranularity(Request $request): string
    {
        $granularity = strtolower((string) $request->query('depreciation_granularity', 'month'));

        return in_array($granularity, ['day', 'week', 'month', 'year'], true) ? $granularity : 'month';
    }

    private function depreciationSeries(Request $request): array
    {
        $granularity = $this->depreciationGranularity($request);

        $driver = DB::connection()->getDriverName();

        $bucketExpr = match ($granularity) {
            'day' => 'DATE(%s)',
            'week' => match ($driver) {
                'pgsql' => 'EXTRACT(ISOYEAR FROM %s) || \'-\' || EXTRACT(WEEK FROM %s)',
                'sqlite' => "printf('%04d-%02d', CAST(strftime('%Y', %s) AS INTEGER), CAST(strftime('%W', %s) AS INTEGER))",
                default => 'DATE_FORMAT(%s, \'%x-%v\')',
            },
            'year' => match ($driver) {
                'pgsql' => 'EXTRACT(YEAR FROM %s)',
                'sqlite' => "strftime('%Y', %s)",
                default => 'YEAR(%s)',
            },
            default => match ($driver) {
                'pgsql' => 'TO_CHAR(%s, \'YYYY-MM\')',
                'sqlite' => "strftime('%Y-%m', %s)",
                default => 'DATE_FORMAT(%s, \'%Y-%m\')',
            },
        };

        $rows = Asset::query()
            ->selectRaw(sprintf($bucketExpr, 'acquisition_date', 'acquisition_date').' as bucket')
            ->selectRaw('SUM(acquisition_cost * depreciation_rate / 100) as value')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return $rows
            ->map(function ($row) use ($granularity) {
                $bucket = (string) $row->bucket;

                $value = round((float) $row->value, 2);

                if ($value <= 0) {
                    return null;
                }

                return [
                    'label' => $this->labelForBucket($bucket, $granularity),
                    'value' => $value,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function labelForBucket(string $bucket, string $granularity): string
    {
        if ($granularity === 'week' && preg_match('/^(\d{4})-(\d{1,2})$/', $bucket, $matches)) {
            return \Illuminate\Support\Carbon::now()
                ->setISODate((int) $matches[1], (int) $matches[2])
                ->startOfWeek()
                ->format('M j, Y');
        }

        if ($granularity === 'month' && preg_match('/^\d{4}-\d{2}$/', $bucket)) {
            return \Illuminate\Support\Carbon::createFromFormat('Y-m', $bucket)->format('M Y');
        }

        if ($granularity === 'year' && preg_match('/^\d{4}$/', $bucket)) {
            return \Illuminate\Support\Carbon::createFromFormat('Y', $bucket)->format('Y');
        }

        if ($granularity === 'day') {
            return \Illuminate\Support\Carbon::parse($bucket)->format('M j, Y');
        }

        return $bucket;
    }
}
