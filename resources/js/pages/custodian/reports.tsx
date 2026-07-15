import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Download } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes/custodian';
import { PaginationBar } from '@/components/ui/pagination';

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

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    categories: Category[];
    selectedCategory: string;
    selectedSort: string;
    selectedPerPage: number;
    assets: Paginated<Asset>;
}

const sortOptions = [
    { value: 'latest', label: 'Latest to Oldest' },
    { value: 'oldest', label: 'Oldest to Latest' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'cost_high', label: 'Highest Cost' },
    { value: 'cost_low', label: 'Lowest Cost' },
];

export default function Reports({
    categories,
    selectedCategory,
    assets,
    selectedSort,
    selectedPerPage,
}: Props) {
    const [category, setCategory] = useState(selectedCategory);
    const [sort, setSort] = useState(selectedSort);

    function fetchPage(
        page: number,
        overrides: { category?: string; sort?: string; per_page?: number } = {},
    ) {
        router.get(
            '/custodian/reports',
            {
                category: overrides.category ?? category,
                sort: overrides.sort ?? sort,
                per_page: overrides.per_page ?? assets.per_page,
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['assets', 'selectedCategory', 'selectedSort', 'selectedPerPage'] },
        );
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
                            (window.location.href = `/custodian/reports/export-csv?category=${category}&sort=${sort}`)
                        }
                        className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                    >
                        <Download className="size-4" />
                        Export CSV
                    </button>
                </div>

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
                                {assets.data.map((asset) => (
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

                        {assets.data.length === 0 && (
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