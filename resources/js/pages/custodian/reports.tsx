import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

interface PaginatedAssets {
    data: Asset[];
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
    assets: PaginatedAssets;
}

export default function Reports({
    categories,
    selectedCategory,
    assets,
    selectedSort,
    selectedPerPage,
}: Props) {
    return (
        <>
            <Head title="Reports" />

            <div className="flex flex-col gap-6 p-6 lg:p-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        Reports
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Asset insights and overdue monitoring
                    </p>
                </div>

                {/* Main Container */}
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

                    {/* Filters */}
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
                        <div className="flex flex-wrap items-end gap-4">

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Category
                                </p>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={(value) =>
                                        router.get(
                                            '/custodian/reports',
                                            { category: value, sort: selectedSort },
                                            { preserveState: true, preserveScroll: true }
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-[220px] cursor-pointer">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="cursor-pointer">
                                            All Categories
                                        </SelectItem>
                                        {categories.map(category => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                                className="cursor-pointer"
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Sort By
                                </p>
                                <Select
                                    value={selectedSort}
                                    onValueChange={(value) =>
                                        router.get(
                                            '/custodian/reports',
                                            { category: selectedCategory, sort: value },
                                            { preserveState: true, preserveScroll: true }
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-[220px] cursor-pointer">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest" className="cursor-pointer">Latest to Oldest</SelectItem>
                                        <SelectItem value="oldest" className="cursor-pointer">Oldest to Latest</SelectItem>
                                        <SelectItem value="name_asc" className="cursor-pointer">Name A-Z</SelectItem>
                                        <SelectItem value="name_desc" className="cursor-pointer">Name Z-A</SelectItem>
                                        <SelectItem value="cost_high" className="cursor-pointer">Highest Cost</SelectItem>
                                        <SelectItem value="cost_low" className="cursor-pointer">Lowest Cost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Items Per Page
                                </p>

                                <Select
                                    value={String(selectedPerPage)}
                                    onValueChange={(value) =>
                                        router.get(
                                            '/custodian/reports',
                                            {
                                                category: selectedCategory,
                                                sort: selectedSort,
                                                per_page: value,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            }
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-[150px] cursor-pointer">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="10" className="cursor-pointer">
                                            10
                                        </SelectItem>

                                        <SelectItem value="15" className="cursor-pointer">
                                            15
                                        </SelectItem>

                                        <SelectItem value="25" className="cursor-pointer">
                                            25
                                        </SelectItem>

                                        <SelectItem value="50" className="cursor-pointer">
                                            50
                                        </SelectItem>

                                        <SelectItem value="100" className="cursor-pointer">
                                            100
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className='flex flex-wrap items-end gap-4'>
                            <button
                                onClick={() =>
                                    window.location.href =
                                    `/custodian/reports/export-csv?category=${selectedCategory}&sort=${selectedSort}`
                                }
                                className="
                                    inline-flex items-center gap-2
                                    rounded-xl
                                    bg-[#0d7a5f]
                                    px-4 py-2.5
                                    text-sm font-semibold text-white
                                    shadow-sm
                                    transition-all
                                    hover:bg-[#0b6a52]
                                    hover:shadow-md
                                    cursor-pointer
                                "
                            >
                                <Download className="h-4 w-4" />

                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Table and Pagination Wrapper */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-gray-50 dark:bg-zinc-900 z-10">
                                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Asset Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Asset Tag
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Asset Type
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Cost
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Rate
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Total Depreciation
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {assets.data.map(asset => (
                                        <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {asset.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                                                    {asset.asset_tag}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                    {asset.category?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                                    {asset.asset_type?.name ?? '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-sm">
                                                ₱{Number(asset.acquisition_cost).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                {asset.depreciation_rate ? (
                                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                                                        {asset.depreciation_rate}%
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-sm">
                                                {asset.total_depreciation
                                                    ? `₱${asset.total_depreciation.toLocaleString()}`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-6 py-4 bg-white dark:bg-zinc-900 dark:border-zinc-800 gap-4">
                            {/* Responsive spacing left balance */}
                            <div className="hidden sm:block w-[200px]" />

                            {/* Navigation controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={assets.current_page === 1}
                                    onClick={() =>
                                        router.get('/custodian/reports',
                                            { page: assets.current_page - 1, category: selectedCategory, sort: selectedSort },
                                            { preserveScroll: true, preserveState: true }
                                        )
                                    }
                                    className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                {assets.current_page > 1 && (
                                    <button
                                        onClick={() =>
                                            router.get('/custodian/reports',
                                                { page: assets.current_page - 1, category: selectedCategory, sort: selectedSort },
                                                { preserveScroll: true, preserveState: true }
                                            )
                                        }
                                        className="px-3 py-1.5 text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
                                    >
                                        {assets.current_page - 1}
                                    </button>
                                )}

                                <span className="rounded-lg bg-[#0d7a5f] px-4 py-1.5 text-sm font-semibold text-white selection:bg-transparent">
                                    {assets.current_page}
                                </span>

                                {assets.current_page < assets.last_page && (
                                    <button
                                        onClick={() =>
                                            router.get('/custodian/reports',
                                                { page: assets.current_page + 1, category: selectedCategory, sort: selectedSort },
                                                { preserveScroll: true, preserveState: true }
                                            )
                                        }
                                        className="px-3 py-1.5 text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
                                    >
                                        {assets.current_page + 1}
                                    </button>
                                )}

                                <button
                                    disabled={assets.current_page === assets.last_page}
                                    onClick={() =>
                                        router.get('/custodian/reports',
                                            { page: assets.current_page + 1, category: selectedCategory, sort: selectedSort },
                                            { preserveScroll: true, preserveState: true }
                                        )
                                    }
                                    className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label="Next Page"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Asset info tracking right side */}
                            <div className="w-full sm:w-[200px] text-center sm:text-right text-sm text-gray-500">
                                Showing {assets.from ?? 0}-{assets.to ?? 0} of {assets.total} assets
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}