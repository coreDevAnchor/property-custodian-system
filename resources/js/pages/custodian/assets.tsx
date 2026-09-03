import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Armchair,
    FileUp,
    Laptop,
    Package,
    Pencil,
    Plus,
    Search,
    Video,
    Eye,
} from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { rowVariants } from '@/components/assets/asset-table-animations';
import { AssetFormDialog } from '@/components/assets/assets-form-dialog';
import { AssetViewDialog } from '@/components/assets/assets-views-dialog';
import { ImportAssetsDialog } from '@/components/assets/import-assets-dialog';
import { AnimatedTableBody } from '@/components/ui/animated-table-body';
import { Badge } from '@/components/ui/badge';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { PaginationBar } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes/custodian';
import assetRoutes from '@/routes/custodian/assets';
import type {
    AssetStatus,
    AssetType,
    Asset,
    AssetFilters,
} from '@/types/assets';
import { statusOptions } from '@/types/assets';
import type { Category } from '@/types/categories';
import type { Location } from '@/types/location';
import type { Paginated } from '@/types/pagination';

// ─── Types ──────────────────────────────────────────────────────────────────

const statusLabels: Record<AssetStatus, string> = {
    available: 'Available',
    borrowed: 'Borrowed',
    under_repair: 'Under Repair',
    disposed: 'Pull out',
    lost: 'Lost',
};

const categoryIcon: Record<string, typeof Laptop> = {
    Electronics: Laptop,
    Furniture: Armchair,
    'Office Equipment': Video,
    'Office Supplies': Package,
};

const statusStyles: Record<string, string> = {
    available:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

    borrowed:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

    under_repair:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

    disposed: 'bg-muted text-muted-foreground',

    lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AssetStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

function AssetRow({
    asset,
    onEdit,
    onView,
}: {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onView: (asset: Asset) => void;
}) {
    const Icon = asset.category
        ? (categoryIcon[asset.category.name] ?? Package)
        : Package;

    return (
        <motion.tr
            variants={rowVariants}
            layout={false}
            onClick={() => onView(asset)}
            className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
        >
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                        <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {asset.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {asset.asset_tag}
                        </p>
                    </div>
                </div>
            </td>
            <td className="py-3.5 pr-4">
                <span
                    className="block max-w-[150px] truncate text-sm text-foreground"
                    title={asset.category?.name ?? 'Unspecified'}
                >
                    {asset.category?.name ?? 'Unspecified'}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge status={asset.status} />
            </td>
            <td className="py-3.5 pr-4">
                <span
                    className="block max-w-[120px] truncate text-sm text-muted-foreground"
                    title={asset.location?.name ?? '—'}
                >
                    {asset.location?.name ?? '—'}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                <span
                    className="block max-w-[120px] truncate text-sm text-muted-foreground"
                    title={
                        asset.status === 'borrowed'
                            ? (asset.current_borrow?.borrower?.name ??
                              'Borrowed')
                            : '—'
                    }
                >
                    {asset.status === 'borrowed'
                        ? (asset.current_borrow?.borrower?.name ?? 'Borrowed')
                        : '—'}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">
                    {asset.acquisition_date}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-foreground">
                    {asset.category?.unit_type === 'multi'
                        ? (asset.amount ?? 1)
                        : '—'}
                </span>
            </td>
            <td className="py-3.5">
                <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(asset);
                        }}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500"
                        aria-label={`Edit ${asset.name}`}
                    >
                        <Pencil className="size-4" />
                    </button>

                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
                                aria-label={`View borrow history for ${asset.name}`}
                            >
                                <Eye className="size-4" />
                            </button>
                        </HoverCardTrigger>

                        <HoverCardContent
                            className="w-80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-3">
                                <h4 className="font-semibold">
                                    Current Status
                                </h4>

                                <p className="text-sm text-muted-foreground">
                                    {asset.status === 'available' &&
                                        'This asset is currently available.'}

                                    {asset.status === 'borrowed' && (
                                        <>
                                            Currently borrowed by:{' '}
                                            <span className="font-medium text-foreground">
                                                {asset.current_borrow?.borrower
                                                    ?.name ??
                                                    'Unknown borrower'}
                                            </span>
                                        </>
                                    )}

                                    {asset.status === 'under_repair' &&
                                        'This asset is currently under repair.'}
                                    {asset.status === 'disposed' &&
                                        'This asset has been pulled out.'}
                                    {asset.status === 'lost' &&
                                        'This asset has been reported as lost.'}
                                </p>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </td>
        </motion.tr>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
    assets: Paginated<Asset>;
    assetTypes: AssetType[];
    categories: Category[];
    locations: Location[];
    filters: AssetFilters;
}

export default function Assets({
    assets,
    assetTypes,
    categories,
    locations,
    filters = { search: '', category: 'All', status: 'All', per_page: 10 },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState<string>(
        filters.category ?? 'All',
    );
    const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>(
        (filters.status as 'All' | AssetStatus) ?? 'All',
    );
    const [viewTarget, setViewTarget] = useState<Asset | undefined>();

    const categoryOptions = categories ?? [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | undefined>();

    const animationKey = useMemo(() => {
        return [
            assets.current_page,
            filters.search,
            filters.category,
            filters.status,
        ].join('-');
    }, [assets.current_page, filters.search, filters.category, filters.status]);

    // ── Server-driven filtering/pagination ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<AssetFilters> = {}) {
        router.get(
            assetRoutes.index.url(),
            {
                search: overrides.search ?? search,
                category: overrides.category ?? categoryFilter,
                status: overrides.status ?? statusFilter,
                per_page: overrides.per_page ?? assets.per_page,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['assets', 'filters'],
            },
        );
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;

            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => fetchPage(1), 350);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function handleCategoryChange(value: string) {
        setCategoryFilter(value);
        fetchPage(1, { category: value });
    }

    function handleStatusChange(value: 'All' | AssetStatus) {
        setStatusFilter(value);
        fetchPage(1, { status: value });
    }

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        if (page >= 1 && page <= assets.last_page) {
            fetchPage(page);
        }
    }

    function openAddModal() {
        setEditingAsset(undefined);
        setDialogOpen(true);
    }

    function openEditModal(asset: Asset) {
        setEditingAsset(asset);
        setDialogOpen(true);
    }

    return (
        <>
            <Head title="Assets" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Assets
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage company property inventory
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setImportOpen(true)}
                            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted/60 active:scale-[0.98]"
                        >
                            <FileUp className="size-4" />
                            Upload Excel
                        </button>

                        <button
                            onClick={openAddModal}
                            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98]"
                        >
                            <Plus className="size-4" />
                            Add New Asset
                        </button>
                    </div>
                </div>

                {/* ── Filters + table ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex h-10 w-full max-w-xs items-center gap-2 rounded-lg border border-border bg-background px-3">
                            <Search className="size-4 shrink-0 text-muted-foreground" />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or tag..."
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={categoryFilter}
                                onValueChange={handleCategoryChange}
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="All">
                                        All Categories
                                    </SelectItem>

                                    <SelectItem value="Unspecified">
                                        Unspecified
                                    </SelectItem>

                                    {categoryOptions.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Status */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={
                                        statusFilter === 'All'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="cursor-pointer"
                                    onClick={() => handleStatusChange('All')}
                                >
                                    All
                                </Badge>

                                {statusOptions.map((status) => (
                                    <Badge
                                        key={status}
                                        variant={
                                            statusFilter === status
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="cursor-pointer"
                                        onClick={() =>
                                            handleStatusChange(status)
                                        }
                                    >
                                        {statusLabels[status]}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Asset
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Category
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Location
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Assigned To
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Date Added
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Quantity
                                    </th>
                                    <th className="py-3 text-center text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <AnimatedTableBody
                                loading={false}
                                animate
                                animationKey={animationKey}
                            >
                                {assets.data.map((asset) => (
                                    <AssetRow
                                        key={asset.id}
                                        asset={asset}
                                        onEdit={openEditModal}
                                        onView={setViewTarget}
                                    />
                                ))}
                            </AnimatedTableBody>
                        </table>

                        {assets.data.length === 0 && (
                            <div className="flex flex-col items-center gap-1 py-12 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    No assets found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your search or filters
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

            <AssetFormDialog
                open={dialogOpen}
                mode={editingAsset ? 'edit' : 'create'}
                asset={editingAsset}
                categories={categories}
                locations={locations}
                assetTypes={assetTypes}
                onOpenChange={setDialogOpen}
            />

            <ImportAssetsDialog
                open={importOpen}
                onOpenChange={setImportOpen}
            />

            <AssetViewDialog
                open={!!viewTarget}
                asset={viewTarget}
                onOpenChange={(open) => !open && setViewTarget(undefined)}
                onEdit={openEditModal}
            />
        </>
    );
}

Assets.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Assets',
            href: '/custodian/assets',
        },
    ],
};
