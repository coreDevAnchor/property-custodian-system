import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import {
    AlertTriangle,
    Armchair,
    Car,
    FlaskConical,
    Laptop,
    Pencil,
    Plus,
    Search,
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
import { Asset } from "@/components/assets/types";
import { PaginationBar } from '@/components/ui/pagination';
import { Badge } from "@/components/ui/badge";

// ─── Types ──────────────────────────────────────────────────────────────────

type AssetStatus =
    | 'available'
    | 'borrowed'
    | 'under_repair'
    | 'disposed';

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
                <span className="text-sm text-muted-foreground">
                    {asset.status === 'borrowed'
                        ? (asset.borrows?.find((b) => b.status === 'borrowed')?.borrower?.name ?? 'Borrowed')
                        : (asset.location?.name ?? '—')}
                </span>
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
                                                {borrow.borrower.name}
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface Location {
    id: number;
    name: string;
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

interface Filters {
    search: string;
    category: string;
    status: string;
    per_page: number;
}

interface Props {
    assets: Paginated<Asset>;
    assetTypes: AssetType[];
    categories: Category[];
    locations: Location[];
    filters: Filters;
}

export default function Assets({
    assets,
    assetTypes,
    categories,
    locations,
    filters = { search: '', category: 'All', status: 'All', per_page: 10 },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState<string>(filters.category ?? 'All');
    const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>(
        (filters.status as 'All' | AssetStatus) ?? 'All',
    );
    const [viewTarget, setViewTarget] = useState<Asset | undefined>();

    const categoryOptions = categories ?? [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | undefined>();

    // ── Server-driven filtering/pagination ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        router.get(
            '/custodian/assets',
            {
                search: overrides.search ?? search,
                category: overrides.category ?? categoryFilter,
                status: overrides.status ?? statusFilter,
                per_page: overrides.per_page ?? assets.per_page,
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['assets', 'filters'] },
        );
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPage(1), 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
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
        fetchPage(page);
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
                                onValueChange={handleCategoryChange}
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
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant={statusFilter === "All" ? "default" : "secondary"}
                                    className="cursor-pointer"
                                    onClick={() => handleStatusChange("All")}
                                >
                                    All
                                </Badge>

                                {statusOptions.map((status) => (
                                    <Badge
                                        key={status}
                                        variant={statusFilter === status ? "default" : "secondary"}
                                        className="cursor-pointer"
                                        onClick={() => handleStatusChange(status)}
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
                                {assets.data.map((asset) => (
                                    <AssetRow
                                        key={asset.id}
                                        asset={asset}
                                        onEdit={openEditModal}
                                        onView={setViewTarget}
                                    />
                                ))}
                            </tbody>
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
