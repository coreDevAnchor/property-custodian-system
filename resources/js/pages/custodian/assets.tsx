import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Armchair,
    Car,
    ChevronLeft,
    ChevronRight,
    FlaskConical,
    Laptop,
    Pencil,
    Plus,
    Search,
    Trash2,
    Video,
    X,
    Eye,
} from 'lucide-react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AssetViewDialog } from "@/components/assets/assets-views-dialog";
import { dashboard } from '@/routes/custodian';
import { AssetFormDialog } from "@/components/assets/assets-form-dialog";
import { DeleteConfirmModal } from "@/components/assets/assets-delete.dialog";
import { Asset } from "@/components/assets/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type AssetStatus =
    | 'available'
    | 'borrowed'
    | 'under_repair'
    | 'disposed';

interface Borrow {
    id: number;
    status: string;
    requested_at: string;
    returned_at?: string | null;

    employee: {
        id: number;

        user: {
            name: string;
        };
    };
}


interface Category {
    id: number;
    name: string;
}

interface AssetType {
    id: number;
    name: string;
    prefix: string;

    category: {
        id: number;
        name: string;
    };
}

interface AssetFormValues {
    name: string;
    category_id: number;
    asset_type_id: number;
    location_id: number;
    status: string;
    acquisition_date: string;
    description?: string;
    serial_number?: string;
}

const emptyForm: AssetFormValues = {
    name: '',
    category_id: 0,
    asset_type_id: 0,
    location_id: 0,
    status: 'available',
    acquisition_date: new Date().toISOString().slice(0, 10),
    description: '',
    serial_number: '',
};



const statusOptions: AssetStatus[] = [
    'available',
    'borrowed',
    'under_repair',
    'disposed',
];

const statusLabels: Record<AssetStatus, string> = {
    available: 'Available',
    borrowed: 'Borrowed',
    under_repair: 'Under Repair',
    disposed: 'Disposed',
};

const categoryIcon: Record<string, typeof Laptop> = {
    Electronics: Laptop,
    Furniture: Armchair,
    'Office Equipment': Video,
};

const statusStyles: Record<string, string> = {
    available:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

    borrowed:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

    under_repair:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

    disposed:
        'bg-muted text-muted-foreground',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
    onDelete,
    onView,
}: {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
    onView: (asset: Asset) => void;
}) {
    const Icon = categoryIcon[asset.category.name];

    return (
        <tr
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
                        <p className="truncate text-xs text-muted-foreground">{asset.asset_tag}</p>
                    </div>
                </div>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-foreground">{asset.category.name}</span>
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge status={asset.status} />
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">{asset.location.name}</span>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">{asset.acquisition_date}</span>
            </td>
            <td className="py-3.5">
                <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(asset);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500 cursor-pointer"
                        aria-label={`Edit ${asset.name}`}
                    >
                        <Pencil className="size-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(asset);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                        aria-label={`Delete ${asset.name}`}
                    >
                        <Trash2 className="size-4" />
                    </button>

                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
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
                                <h4 className="font-semibold">Borrow History</h4>

                                {(asset.borrows ?? []).length > 0 ? (
                                    (asset.borrows ?? []).map((borrow) => (
                                        <div
                                            key={borrow.id}
                                            className="border-b border-border pb-2 last:border-0"
                                        >
                                            <div className="font-medium">
                                                {borrow.employee.user.name}
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                Requested:{' '}
                                                {new Date(
                                                    borrow.requested_at
                                                ).toLocaleDateString()}
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                Status: {borrow.status}
                                            </div>

                                            {borrow.returned_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    Returned:{' '}
                                                    {new Date(
                                                        borrow.returned_at
                                                    ).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No borrowing history.
                                    </p>
                                )}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </td>
        </tr>
    );
}

// ─── Pagination component ──────────────────────────────────────────────────

// ─── Improved Pagination component ──────────────────────────────────────────────────

function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    // Build a compact list of page numbers with ellipses
    const pages: (number | 'ellipsis')[] = [];

    // Always show first page
    pages.push(1);

    // Dynamic sibling range strategy
    const siblingCount = 1;
    const leftSiblingIndex = Math.max(page - siblingCount, 2);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages - 1);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (showLeftEllipsis) {
        pages.push('ellipsis');
    }

    // Render middle range pages
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
    }

    if (showRightEllipsis) {
        pages.push('ellipsis');
    }

    // Always show last page if it's more than page 1
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center gap-1.5 justify-center sm:justify-end">
            {/* Previous Page Button */}
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer border border-border/50 bg-background"
                aria-label="Go to previous page"
            >
                <ChevronLeft className="size-4" />
            </button>

            {/* Main Interactive Page Numbers Lineup */}
            <div className="flex items-center gap-1">
                {pages.map((p, idx) =>
                    p === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground select-none"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            aria-current={p === page ? 'page' : undefined}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer ${p === page
                                    ? 'bg-orange-500 text-white shadow-sm font-semibold scale-105'
                                    : 'text-foreground hover:bg-muted border border-transparent hover:border-border'
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}
            </div>

            {/* Next Page Button */}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer border border-border/50 bg-background"
                aria-label="Go to next page"
            >
                <ChevronRight className="size-4" />
            </button>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface Location {
    id: number;
    name: string;
}

interface Props {
    assets: {
        data: Asset[];
    };

    assetTypes: AssetType[];
    categories: Category[];
    locations: Location[];
}

export default function Assets({ assets, assetTypes, categories, locations }: Props) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');
    const [viewTarget, setViewTarget] = useState<Asset | undefined>();
    type AssetModalMode = 'create' | 'edit' | 'view';

    const categoryOptions = categories ?? [];

    const [dialogOpen, setDialogOpen] = useState(false);

    const [editingAsset, setEditingAsset] =
        useState<Asset | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

    // ── Pagination state ──
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]); // default 25

    const filteredAssets = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        return (assets?.data ?? []).filter((asset) => {
            const matchesSearch =
                !searchTerm ||
                asset.name.toLowerCase().includes(searchTerm) ||
                asset.asset_tag.toLowerCase().includes(searchTerm) ||
                asset.asset_type.name.toLowerCase().includes(searchTerm) ||
                asset.category.name.toLowerCase().includes(searchTerm) ||
                asset.location.name.toLowerCase().includes(searchTerm);

            const matchesCategory =
                categoryFilter === "All" ||
                asset.category.id.toString() === categoryFilter;

            const matchesStatus =
                statusFilter === "All" ||
                asset.status === statusFilter;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });
    }, [
        assets,
        search,
        categoryFilter,
        statusFilter,
    ]);

    // Reset to page 1 whenever the filtered set changes (search/filter change)
    useEffect(() => {
        setPage(1);
    }, [search, categoryFilter, statusFilter, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));

    // Guard against being stranded on a page that no longer exists
    const currentPage = Math.min(page, totalPages);

    const paginatedAssets = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAssets.slice(start, start + pageSize);
    }, [filteredAssets, currentPage, pageSize]);

    const rangeStart = filteredAssets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, filteredAssets.length);

    function openAddModal() {
        setEditingAsset(undefined);
        setDialogOpen(true);
    }

    function openEditModal(asset: Asset) {
        setEditingAsset(asset);
        setDialogOpen(true);
    }



    function handleDeleteConfirm() {
        if (!deleteTarget) return;

        router.delete(
            `/custodian/assets/${deleteTarget.id}`,
            {
                onSuccess: () => setDeleteTarget(null),
            }
        );
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

                    <button
                        onClick={openAddModal}
                        className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="size-4" />
                        Add New Asset
                    </button>
                </div>

                {/* ── Filters + table ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 h-10 w-full max-w-xs">
                            <Search className="size-4 text-muted-foreground shrink-0" />

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
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="All">
                                        All Categories
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
                            <Select
                                value={statusFilter}
                                onValueChange={(value) =>
                                    setStatusFilter(value as "All" | AssetStatus)
                                }
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="All">
                                        All Statuses
                                    </SelectItem>

                                    {statusOptions.map((status) => (
                                        <SelectItem
                                            key={status}
                                            value={status}
                                        >
                                            {statusLabels[status]}
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
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Location / Assigned To
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Date Added
                                    </th>
                                    <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAssets.map((asset) => (
                                    <AssetRow
                                        key={asset.id}
                                        asset={asset}
                                        onEdit={openEditModal}
                                        onDelete={setDeleteTarget}
                                        onView={setViewTarget}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {filteredAssets.length === 0 && (
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

                    <div className="flex flex-col gap-3 border-t border-border px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                                {filteredAssets.length === 0
                                    ? 'Showing 0 assets'
                                    : `Showing ${rangeStart}–${rangeEnd} of ${filteredAssets.length} assets`}
                            </p>

                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => setPageSize(Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[110px] cursor-pointer text-xs">
                                    <SelectValue placeholder="Per page" />
                                </SelectTrigger>

                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size} / page
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            </div>

            <AssetFormDialog
                open={dialogOpen}
                mode={editingAsset ? "edit" : "create"}
                asset={editingAsset}
                categories={categories}
                locations={locations}
                assetTypes={assetTypes}
                onOpenChange={setDialogOpen}
            />

            <AssetViewDialog
                open={!!viewTarget}
                asset={viewTarget}
                onOpenChange={(open) => !open && setViewTarget(undefined)}
                onEdit={openEditModal}
            />

            <DeleteConfirmModal
                asset={deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
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