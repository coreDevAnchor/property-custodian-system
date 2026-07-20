import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes/custodian';
import { PaginationBar } from '@/components/ui/pagination';
import { MonthlyUsageChart } from '@/components/reports/monthly-usage-chart';

interface Category {
    id: number;
    name: string;
}

interface Asset {
    id: number;
    asset_tag: string;
    name: string;
    acquisition_cost: number;
    depreciation_rate?: number | null;
    total_depreciation?: number | null;

    category?: {
        name: string;
    };

    asset_type?: {
        name: string;
    };
}

interface OverdueItem {
    id: number;
    borrower: string | null;
    asset_name: string | null;
    asset_tag: string | null;
    category: string | null;
    expected_return_date: string;
    days_overdue: number;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

type ReportView = 'assets' | 'overdue';

interface MonthlyUsagePoint {
    month: string;
    label: string;
    count: number;
}

interface Props {
    categories: Category[];
    selectedCategory: string;
    selectedSort: string;
    selectedView: ReportView;
    overdueCount: number;
    monthlyUsage: MonthlyUsagePoint[];
    assets: Paginated<Asset> | null;
    overdueItems: Paginated<OverdueItem> | null;
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

function OverdueBadge({ days }: { days: number }) {
    const cls =
        days >= 14
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : days >= 7
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
            <AlertTriangle className="size-3" />
            {days}d overdue
        </span>
    );
}

export default function Reports({
    categories,
    selectedCategory,
    selectedSort,
    selectedView,
    overdueCount,
    monthlyUsage,
    assets,
    overdueItems,
}: Props) {
    const [view, setView] = useState<ReportView>(selectedView ?? 'assets');
    const [category, setCategory] = useState(selectedCategory);
    const [sort, setSort] = useState(selectedSort);

    const currentPage = view === 'overdue' ? overdueItems : assets;

    function fetchPage(
        page: number,
        overrides: { view?: ReportView; category?: string; sort?: string; per_page?: number } = {},
    ) {
        const nextView = overrides.view ?? view;
        router.get(
            '/custodian/reports',
            {
                view: nextView,
                category: overrides.category ?? category,
                sort: overrides.sort ?? sort,
                per_page: overrides.per_page ?? (currentPage?.per_page ?? 15),
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['assets', 'overdueItems', 'monthlyUsage', 'selectedCategory', 'selectedSort', 'selectedView', 'overdueCount'],
            },
        );
    }

    function handleViewChange(value: string) {
        const nextView = value as ReportView;
        setView(nextView);
        // Reset sort to the new view's default when switching tabs, since
        // asset sort keys (e.g. "cost_high") don't apply to overdue items.
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

    const sortOptions = view === 'overdue' ? overdueSortOptions : assetSortOptions;

    return (
        <>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Reports
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Asset insights and overdue monitoring
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            (window.location.href = `/custodian/reports/export-csv?view=${view}&category=${category}&sort=${sort}`)
                        }
                        className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                    >
                        <Download className="size-4" />
                        Export CSV
                    </button>
                </div>

                {/* ── Overdue stat card (always visible, both tabs) ── */}
                {overdueCount > 0 && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 dark:bg-red-500/20">
                            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">
                                {overdueCount} {overdueCount === 1 ? 'asset is' : 'assets are'} currently overdue
                            </p>
                            {view !== 'overdue' && (
                                <button
                                    onClick={() => handleViewChange('overdue')}
                                    className="text-xs font-semibold text-red-600 underline hover:text-red-700 dark:text-red-400 cursor-pointer"
                                >
                                    View overdue items
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <MonthlyUsageChart data={monthlyUsage} />

                {/* ── Tabs ── */}
                <Tabs value={view} onValueChange={handleViewChange}>
                    <TabsList>
                        <TabsTrigger value="assets" className="cursor-pointer">
                            Asset Report
                        </TabsTrigger>
                        <TabsTrigger value="overdue" className="cursor-pointer">
                            Overdue Items
                            {overdueCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {overdueCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* ── Filters + table ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={category} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sort} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {view === 'assets' ? (
                        <>
                            <div className="overflow-x-auto px-6 pb-2">
                                <table className="w-full min-w-[760px]">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Asset
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Category
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Asset Type
                                            </th>
                                            <th className="py-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Cost
                                            </th>
                                            <th className="py-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Rate
                                            </th>
                                            <th className="py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Total Depreciation
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(assets?.data ?? []).map((asset) => (
                                            <tr
                                                key={asset.id}
                                                className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="py-3.5 pr-4">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">
                                                            {asset.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {asset.asset_tag}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span className="text-sm text-foreground">
                                                        {asset.category?.name ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span className="text-sm text-muted-foreground">
                                                        {asset.asset_type?.name ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-4 text-right whitespace-nowrap font-mono text-sm text-foreground">
                                                    ₱{Number(asset.acquisition_cost).toLocaleString()}
                                                </td>
                                                <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                                                    {asset.depreciation_rate ? (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                            {asset.depreciation_rate}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 text-right whitespace-nowrap font-mono text-sm text-foreground">
                                                    {asset.total_depreciation
                                                        ? `₱${asset.total_depreciation.toLocaleString()}`
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {(assets?.data ?? []).length === 0 && (
                                    <div className="flex flex-col items-center gap-1 py-12 text-center">
                                        <p className="text-sm font-semibold text-foreground">
                                            No assets found
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Try adjusting your filters
                                        </p>
                                    </div>
                                )}
                            </div>

                            {assets && (
                                <PaginationBar
                                    currentPage={assets.current_page}
                                    lastPage={assets.last_page}
                                    total={assets.total}
                                    from={assets.from}
                                    to={assets.to}
                                    perPage={assets.per_page}
                                    itemLabel="assets"
                                    onPageChange={handlePageChange}
                                    onPerPageChange={handlePerPageChange}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <div className="overflow-x-auto px-6 pb-2">
                                <table className="w-full min-w-[680px]">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Borrower
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Asset
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Category
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Expected Return
                                            </th>
                                            <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(overdueItems?.data ?? []).map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="py-3.5 pr-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.borrower ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm text-foreground">
                                                            {item.asset_name ?? '—'}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {item.asset_tag}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.category ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(item.expected_return_date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="py-3.5">
                                                    <OverdueBadge days={item.days_overdue} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {(overdueItems?.data ?? []).length === 0 && (
                                    <div className="flex flex-col items-center gap-1 py-12 text-center">
                                        <p className="text-sm font-semibold text-foreground">
                                            No overdue items
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Everything currently borrowed is within its return window.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {overdueItems && (
                                <PaginationBar
                                    currentPage={overdueItems.current_page}
                                    lastPage={overdueItems.last_page}
                                    total={overdueItems.total}
                                    from={overdueItems.from}
                                    to={overdueItems.to}
                                    perPage={overdueItems.per_page}
                                    itemLabel="overdue items"
                                    onPageChange={handlePageChange}
                                    onPerPageChange={handlePerPageChange}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Reports', href: '/custodian/reports' },
    ],
};