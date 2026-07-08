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
import { dashboard } from '@/routes/custodian';

// ─── Types ──────────────────────────────────────────────────────────────────

type AssetCategory =
    | 'IT Equipment'
    | 'Vehicles'
    | 'Office Furniture'
    | 'Lab Equipment'
    | 'Audio/Visual';

type AssetStatus =
    | 'available'
    | 'borrowed'
    | 'under_repair'
    | 'retired';

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

interface Asset {
    id: number;
    asset_tag: string;
    name: string;
    description?: string;
    serial_number?: string;

    status: AssetStatus;
    acquisition_date: string;

    category: {
        id: number;
        name: string;
    };

    location: {
        id: number;
        name: string;
    };

    borrows?: Borrow[];
}
interface AssetFormValues {
    name: string;
    asset_tag: string;
    category_id: number;
    location_id: number;
    status: string;
    acquisition_date: string;
    description?: string;
    serial_number?: string;
}

const emptyForm: AssetFormValues = {
    name: '',
    asset_tag: '',
    category_id: 0,
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
    'retired',
];

const statusLabels: Record<AssetStatus, string> = {
    available: 'Available',
    borrowed: 'Borrowed',
    under_repair: 'Under Repair',
    retired: 'Retired',
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

    retired:
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
}: {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
}) {
    const Icon = categoryIcon[asset.category.name];

    return (
        <tr className="group border-b border-border transition-colors last:border-0 hover:bg-muted/50">
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
                <span className="text-sm text-foreground">{asset.name}</span>
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
                        onClick={() => onEdit(asset)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500 cursor-pointer"
                        aria-label={`Edit ${asset.name}`}
                    >
                        <Pencil className="size-4" />
                    </button>
                    <button
                        onClick={() => onDelete(asset)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                        aria-label={`Delete ${asset.name}`}
                    >
                        <Trash2 className="size-4" />
                    </button>
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg
                                    text-muted-foreground transition-colors cursor-pointer
                                    hover:bg-emerald-500/10 hover:text-emerald-500"
                            >
                                <Eye className="size-4" />
                            </button>
                        </HoverCardTrigger>

                        <HoverCardContent className="w-80">
                            <div className="space-y-3">
                                <h4 className="font-semibold">
                                    Borrow History
                                </h4>

                                {asset.borrows?.length ? (
                                    asset.borrows.map((borrow) => (
                                        <div
                                            key={borrow.id}
                                            className="border-b border-border pb-2 last:border-0"
                                        >
                                            <div className="font-medium">
                                                {borrow.employee.user.name}
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                Requested:
                                                {" "}
                                                {new Date(
                                                    borrow.requested_at
                                                ).toLocaleDateString()}
                                            </div>

                                            <div className="text-xs text-muted-foreground">
                                                Status:
                                                {" "}
                                                {borrow.status}
                                            </div>

                                            {borrow.returned_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    Returned:
                                                    {" "}
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

function AssetFormModal({
    open,
    initialValues,
    isEditing,
    onClose,
    onSubmit,
}: {
    open: boolean;
    initialValues: AssetFormValues;
    isEditing: boolean;
    onClose: () => void;
    onSubmit: (values: AssetFormValues) => void;
}) {
    const [values, setValues] = useState<AssetFormValues>(initialValues);

    // Sync form state whenever a different asset is opened for editing
    useMemo(() => setValues(initialValues), [initialValues]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-base font-bold text-gray-900">
                        {isEditing ? 'Edit Asset' : 'Add New Asset'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit(values);
                    }}
                    className="flex flex-col gap-4 px-6 py-5"
                >
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                            Asset Name
                        </label>
                        <input
                            required
                            value={values.name}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, name: e.target.value }))
                            }
                            placeholder="e.g. MacBook Pro 14&quot;"
                            className="h-10 rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                            Tag / Serial Number
                        </label>
                        <input
                            required
                            value={values.asset_tag}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, asset_tag: e.target.value }))
                            }
                            placeholder="e.g. AST-0009"
                            className="h-10 rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Category
                            </label>
                            <select
                                value={values.category_id}
                                onChange={(e) =>
                                    setValues((v) => ({
                                        ...v,
                                        category_id: Number(e.target.value),
                                    }))
                                }
                                className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-[#0d7a5f] focus:ring-2 focus:ring-[#0d7a5f]/20 focus:outline-none"
                            >
                                {categoryOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={values.status}
                                onChange={(e) =>
                                    setValues((v) => ({
                                        ...v,
                                        status: e.target.value as AssetStatus,
                                    }))
                                }
                                className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-[#0d7a5f] focus:ring-2 focus:ring-[#0d7a5f]/20 focus:outline-none"
                            >
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {statusLabels[s]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                            Location / Assigned To
                        </label>
                        <input
                            required
                            value={values.location_id}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, location_id: Number(e.target.value) }))
                            }
                            placeholder="e.g. Storage Room A"
                            className="h-10 rounded-lg border border-border px-3 text-sm text-gray-700 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                            Date Added
                        </label>
                        <input
                            required
                            type="date"
                            value={values.acquisition_date}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, acquisition_date: e.target.value }))
                            }
                            className="h-10 rounded-lg border border-border px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-bold text-white transition-colors hover:bg-orange-600 active:scale-[0.98]"
                        >
                            {isEditing ? 'Save Changes' : 'Add Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteConfirmModal({
    asset,
    onCancel,
    onConfirm,
}: {
    asset: Asset | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (!asset) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                    <AlertTriangle className="size-5 text-red-500" />
                </div>
                <h2 className="mt-4 text-base font-bold text-muted-foreground">
                    Delete this asset?
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    <span className="font-semibold text-foreground">{asset.name}</span>{' '}
                    ({asset.asset_tag}) will be permanently removed from the inventory. This
                    action cannot be undone.
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="h-10 rounded-lg px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="h-10 rounded-lg bg-red-500 px-4 text-sm font-bold text-white transition-colors hover:bg-red-600 active:scale-[0.98]"
                    >
                        Delete Asset
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
    assets: Asset[];
}

export default function Assets({ assets }: Props) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');

    const categoryOptions = useMemo(
        () => [...new Set(assets.map((a) => a.category.name))],
        [assets]
    );

    const [formOpen, setFormOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

    const filteredAssets = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        return assets.filter((asset) => {
            const matchesSearch =
                !searchTerm ||
                asset.name.toLowerCase().includes(searchTerm) ||
                asset.asset_tag.toLowerCase().includes(searchTerm) ||
                asset.category.name.toLowerCase().includes(searchTerm) ||
                asset.location.name.toLowerCase().includes(searchTerm);

            const matchesCategory =
                categoryFilter === 'All' ||
                asset.category.name === categoryFilter;

            const matchesStatus =
                statusFilter === 'All' ||
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
        setEditingAsset(null);
        setFormOpen(true);
    }

    function openEditModal(asset: Asset) {
        setEditingAsset(asset);
        setFormOpen(true);
    }

    function closeFormModal() {
        setFormOpen(false);
        setEditingAsset(null);
    }

    function handleFormSubmit(values: AssetFormValues) {
        if (editingAsset) {
            router.put(
                `/custodian/assets/${editingAsset.id}`,
                {
                    ...values,
                },
                {
                    onSuccess: closeFormModal,
                }
            );
        } else {
            router.post(
                '/custodian/assets',
                {
                    ...values,
                },
                {
                    onSuccess: closeFormModal,
                }
            );
        }
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
                        className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98]"
                    >
                        <Plus className="size-4" />
                        Add New Asset
                    </button>
                </div>

                {/* ── Filters + table ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or tag…"
                                className="h-10 w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-10 rounded-lg border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            >
                                <option value="All">All Categories</option>

                                {categoryOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as 'All' | AssetStatus)
                                }
                                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            >
                                <option value="All">All Statuses</option>
                                {statusOptions.map((s) => (
                                    <option className="cursor-pointer" key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
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
                            Showing {filteredAssets.length} of {assets.length} assets
                        </p>
                    </div>
                </div>
            </div>

            <AssetFormModal
                open={formOpen}
                isEditing={!!editingAsset}
                initialValues={
                    editingAsset
                        ? {
                            name: editingAsset.name,
                            asset_tag: editingAsset.asset_tag,
                            category_id: editingAsset.category.id,
                            location_id: editingAsset.location.id,
                            status: editingAsset.status,
                            acquisition_date: editingAsset.acquisition_date,
                            description: editingAsset.description ?? '',
                            serial_number: editingAsset.serial_number ?? '',
                        }
                        : emptyForm
                }
                onClose={closeFormModal}
                onSubmit={handleFormSubmit}
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