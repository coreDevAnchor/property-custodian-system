import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Armchair,
    Car,
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

    const filteredAssets = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        return (assets?.data ?? []).filter((asset) => {
            const matchesSearch =
                !searchTerm ||
                asset.name.toLowerCase().includes(searchTerm) ||
                asset.asset_tag.toLowerCase().includes(searchTerm) ||
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
                                {filteredAssets.map((asset) => (
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

                    <div className="flex items-center justify-between border-t border-border px-6 py-3.5">
                        <p className="text-xs text-muted-foreground">
                            Showing {filteredAssets.length} of {assets?.data?.length ?? 0} assets
                        </p>
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