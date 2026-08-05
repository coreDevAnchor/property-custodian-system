import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { AlertTriangle, Download, PackageX } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard, reports as custodianReports } from '@/routes/custodian';
import { exportMethod as exportReports } from '@/routes/custodian/reports';
import { PaginationBar } from '@/components/ui/pagination';
import { MonthlyUsageChart } from '@/components/reports/monthly-usage-chart';
import { ReportSummaryGrid } from '@/components/reports/report-summary-grid';
import { Paginated } from '@/types/pagination';
import { Category } from '@/types/categories';
import { Asset } from '@/types/assets';
import {
    OverdueItem,
    LostItem,
    ReportView,
    MonthlyUsagePoint,
    BorrowerAnalytics,
    DepreciationSummary,
    UsageMetric,
    ReportSummary,
    ReportPeriod
} from '@/types/reports';

import { BorrowerAnalyticsChart } from '@/components/reports/borrower-analytics-chart';
import { AssetValuationCard } from '@/components/reports/asset-valuation-card';
import { DepreciationCard } from '@/components/reports/depreciation-card';
import { ReportHeader } from '@/components/reports/report-header';
import { TopEmployeeCard } from '@/components/reports/top-employee-card';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportTabs } from '@/components/reports/report-tabs';
import { AssetsReportTable } from '@/components/reports/table/assets-report-table';
import { OverdueReportTable } from '@/components/reports/table/overdue-report-table';
import { LostsReportTable } from '@/components/reports/table/losts-report-table';
import { ExportPdfModal } from '@/components/reports/export-pdf-modal';

interface Props {
    categories: Category[];
    selectedCategory: string;
    selectedSort: string;
    selectedView: ReportView;
    usageMetric: UsageMetric;
    overdueCount: number;
    lostCount: number;
    monthlyUsage: MonthlyUsagePoint[];
    borrowerAnalytics: BorrowerAnalytics;
    depreciationSummary: DepreciationSummary;
    reportSummary: ReportSummary;
    assets: Paginated<Asset> | null;
    overdueItems: Paginated<OverdueItem> | null;
    lostItems: Paginated<LostItem> | null;
    selectedChartPeriod: ReportPeriod;
    selectedEmployeePeriod: ReportPeriod;
    selectedHeaderPeriod: ReportPeriod;
    selectedValuationPeriod: ReportPeriod;
}

const assetSortOptions = [
    { value: 'latest', label: 'Latest to Oldest' },
    { value: 'oldest', label: 'Oldest to Latest' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'cost_high', label: 'Highest Cost' },
    { value: 'cost_low', label: 'Lowest Cost' },
];

const overdueSortOptions = [
    { value: 'most_overdue', label: 'Most Overdue First' },
    { value: 'least_overdue', label: 'Least Overdue First' },
    { value: 'borrower_az', label: 'Borrower A-Z' },
    { value: 'borrower_za', label: 'Borrower Z-A' },
];

export default function Reports({
    categories,
    selectedCategory,
    selectedSort,
    selectedView,
    selectedChartPeriod,
    selectedEmployeePeriod,
    selectedHeaderPeriod,
    selectedValuationPeriod,
    usageMetric,
    overdueCount,
    lostCount,
    monthlyUsage,
    borrowerAnalytics,
    depreciationSummary,
    reportSummary,
    assets,
    overdueItems,
    lostItems,
}: Props) {
    const [view, setView] = useState<ReportView>(selectedView ?? 'assets');
    const [category, setCategory] = useState(selectedCategory);
    const [sort, setSort] = useState(selectedSort);
    const [metric, setMetric] = useState<UsageMetric>(usageMetric ?? 'borrows');
    const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
    const [chartPeriod, setChartPeriod] = useState<ReportPeriod>(
        selectedChartPeriod ?? "month"
    );
    const [valuationPeriod, setValuationPeriod] =
        useState<ReportPeriod>(selectedValuationPeriod);

    const [employeePeriod, setEmployeePeriod] = useState<ReportPeriod>(
        selectedEmployeePeriod ?? "month"
    );

    const [headerPeriod, setHeaderPeriod] = useState<ReportPeriod>(
        selectedHeaderPeriod ?? "month"
    );

    const reportTableRef = useRef<HTMLDivElement>(null);

    const currentPage =
        view === 'overdue'
            ? overdueItems
            : view === 'lost'
                ? lostItems
                : assets;

    function fetchPage(
        page: number,
        overrides: {
            view?: ReportView;
            category?: string;
            sort?: string;
            per_page?: number;
            usageMetric?: UsageMetric;
            chart_period?: ReportPeriod;
            header_period?: ReportPeriod;
            employee_period?: ReportPeriod;
            valuation_period?: ReportPeriod;
        } = {},
    ) {
        const nextView = overrides.view ?? view;
        router.get(
            custodianReports.url(),
            {
                view: overrides.view ?? view,
                category: overrides.category ?? category,
                sort: overrides.sort ?? sort,
                chart_period: overrides.chart_period ?? chartPeriod,
                employee_period: overrides.employee_period ?? employeePeriod,
                header_period: overrides.header_period ?? headerPeriod,
                usage_metric: overrides.usageMetric ?? metric,
                valuation_period: overrides.valuation_period ?? valuationPeriod,
                per_page: overrides.per_page ?? currentPage?.per_page ?? 15,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: [
                    'assets',
                    'overdueItems',
                    'lostItems',

                    'monthlyUsage',
                    'borrowerAnalytics',
                    'reportSummary',
                    'depreciationSummary',

                    'selectedCategory',
                    'selectedSort',
                    'selectedView',

                    'selectedChartPeriod',
                    'selectedEmployeePeriod',
                    'selectedHeaderPeriod',
                    'selectedValuationPeriod',

                    'usageMetric',

                    'overdueCount',
                    'lostCount',
                ],
            },
        );
    }

    function handleHeaderPeriodChange(value: string) {
        const next = value as ReportPeriod;

        setHeaderPeriod(next);

        fetchPage(1, {
            header_period: next,
        });
    }

    function handleViewChange(value: string) {
        const nextView = value as ReportView;
        setView(nextView);
        const defaultSort = nextView === 'overdue' ? 'most_overdue' : 'latest';
        setSort(defaultSort);
        fetchPage(1, { view: nextView, sort: defaultSort });
    }

    function handleCategoryChange(value: string) {
        setCategory(value);
        fetchPage(1, { category: value });
    }

    function handleSortChange(value: string) {
        setSort(value);
        fetchPage(1, { sort: value });
    }

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    function handleMetricChange(value: UsageMetric) {
        setMetric(value);
        fetchPage(1, { usageMetric: value });
    }

    function handleChartPeriodChange(value: string) {
        const next = value as ReportPeriod;

        setChartPeriod(next);

        fetchPage(1, {
            chart_period: next,
        });
    }

    function handleEmployeePeriodChange(value: string) {
        const next = value as ReportPeriod;

        setEmployeePeriod(next);

        fetchPage(1, {
            employee_period: next,
        });
    }

    function handleValuationPeriodChange(value: string) {
        const next = value as ReportPeriod;

        setValuationPeriod(next);

        fetchPage(1, {
            valuation_period: next,
        });
    }

    const sortOptions =
        view === 'overdue' ? overdueSortOptions : assetSortOptions;

    return (
        <>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <ReportHeader
                    period={headerPeriod}
                    onPeriodChange={handleHeaderPeriodChange}
                    onExport={() =>
                    (window.location.href = exportReports.url({
                        query: {
                            view,
                            category,
                            sort,
                            headerPeriod,
                        },
                    }))
                    }
                    onExportPdf={() => setIsExportPdfOpen(true)}
                />

                {/* ── Overdue stat card (always visible, both tabs) ── */}
                {overdueCount > 0 && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 dark:bg-red-500/20">
                            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">
                                {overdueCount}{' '}
                                {overdueCount === 1 ? 'asset is' : 'assets are'}{' '}
                                currently overdue
                            </p>
                            {view !== 'overdue' && (
                                <button
                                    onClick={() => {
                                        handleViewChange('overdue');

                                        setTimeout(() => {
                                            reportTableRef.current?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                            });
                                        }, 150);
                                    }}
                                    className="cursor-pointer text-xs font-semibold text-red-600 underline hover:text-red-700 dark:text-red-400"
                                >
                                    View overdue items
                                </button>
                            )}
                        </div>
                    </div>
                )}



                <div className="mt-8">
                    <div className="space-y-8">

                        <ReportSummaryGrid
                            data={reportSummary}
                        />


                        <MonthlyUsageChart
                            data={monthlyUsage}
                            metric={metric}
                            period={chartPeriod}
                            onMetricChange={handleMetricChange}
                            onPeriodChange={handleChartPeriodChange}
                        />

                        <div className="grid gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-5">

                                {/* Top Employees */}
                                <TopEmployeeCard
                                    data={borrowerAnalytics}
                                    period={employeePeriod}
                                    onPeriodChange={handleEmployeePeriodChange}
                                />
                            </div>

                            <div className="flex flex-col gap-6 lg:col-span-7">
                                <div className="flex flex-col gap-6">

                                    <AssetValuationCard
                                        data={depreciationSummary}
                                        period={valuationPeriod}
                                        onPeriodChange={handleValuationPeriodChange}
                                    />

                                    <DepreciationCard
                                        data={depreciationSummary}
                                    />

                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* ── Tabs ── */}
                <ReportTabs
                    view={view}
                    overdueCount={overdueCount}
                    lostCount={lostCount}
                    onChange={handleViewChange}
                />

                {/* ── Filters + table ── */}
                <div
                    ref={reportTableRef}
                    className="rounded-xl border border-border bg-card text-card-foreground shadow-sm"
                >
                    {/* Header */}
                    <div className="border-b border-border px-6 py-5">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Report Tables
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Browse detailed asset, overdue, and lost item records.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <ReportFilters
                            categories={categories}
                            category={category}
                            sort={sort}
                            sortOptions={sortOptions}
                            onCategoryChange={handleCategoryChange}
                            onSortChange={handleSortChange}
                        />
                    </div>

                    {/* Table */}
                    {view === 'assets' ? (
                        assets ? (
                            <AssetsReportTable
                                assets={assets}
                                handlePageChange={handlePageChange}
                                handlePerPageChange={handlePerPageChange}
                            />
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                No asset data available.
                            </div>
                        )
                    ) : view === 'overdue' ? (
                        overdueItems ? (
                            <OverdueReportTable
                                overdueItems={overdueItems}
                                handlePerPageChange={handlePerPageChange}
                                handlePageChange={handlePageChange}
                            />
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                No overdue items.
                            </div>
                        )
                    ) : (
                        lostItems ? (
                            <LostsReportTable
                                lostItems={lostItems}
                                handlePerPageChange={handlePerPageChange}
                                handlePageChange={handlePageChange}
                            />
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                No lost items.
                            </div>
                        )
                    )}
                </div>
            </div >

            <ExportPdfModal
                open={isExportPdfOpen}
                onOpenChange={setIsExportPdfOpen}
                filters={{
                    category,
                    sort,
                    headerPeriod,
                    chartPeriod,
                    employeePeriod,
                    usageMetric: metric,
                }}
            />
        </>
    );
}

Reports.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Reports', href: '/custodian/reports' },
    ],
};