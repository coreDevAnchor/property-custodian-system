import { Head } from '@inertiajs/react';
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
} from 'lucide-react';
import { dashboard } from '@/routes/custodian';

// ─── Types ──────────────────────────────────────────────────────────────────

type AssetCategory =
    | 'IT Equipment'
    | 'Vehicles'
    | 'Office Furniture'
    | 'Lab Equipment'
    | 'Audio/Visual';

type AssetStatus = 'Available' | 'Borrowed' | 'Under Repair' | 'Retired';

interface Asset {
    id: number;
    name: string;
    tag: string;
    category: AssetCategory;
    status: AssetStatus;
    location: string;
    dateAdded: string;
}

type AssetFormValues = Omit<Asset, 'id'>;

const emptyForm: AssetFormValues = {
    name: '',
    tag: '',
    category: 'IT Equipment',
    status: 'Available',
    location: '',
    dateAdded: new Date().toISOString().slice(0, 10),
};

// ─── Static mock data (replaced with real props once API is ready) ────────────

const initialAssets: Asset[] = [
    {
        id: 1,
        name: 'MacBook Pro 14"',
        tag: 'AST-0001',
        category: 'IT Equipment',
        status: 'Available',
        location: 'Storage Room A',
        dateAdded: '2025-11-02',
    },
    {
        id: 2,
        name: 'Dell Latitude 5420',
        tag: 'AST-0002',
        category: 'IT Equipment',
        status: 'Borrowed',
        location: 'w/ Carlo Villanueva',
        dateAdded: '2025-09-15',
    },
    {
        id: 3,
        name: 'Toyota Hilux (Van 2)',
        tag: 'AST-0003',
        category: 'Vehicles',
        status: 'Available',
        location: 'Motor Pool',
        dateAdded: '2024-06-01',
    },
    {
        id: 4,
        name: 'Epson EB-X06 Projector',
        tag: 'AST-0004',
        category: 'Audio/Visual',
        status: 'Borrowed',
        location: 'w/ Kim Santos',
        dateAdded: '2025-03-20',
    },
    {
        id: 5,
        name: 'Executive Office Chair',
        tag: 'AST-0005',
        category: 'Office Furniture',
        status: 'Available',
        location: '3rd Floor Storage',
        dateAdded: '2023-01-10',
    },
    {
        id: 6,
        name: 'Nikon DSLR Camera Kit',
        tag: 'AST-0006',
        category: 'Audio/Visual',
        status: 'Under Repair',
        location: 'IT Service Center',
        dateAdded: '2024-08-14',
    },
    {
        id: 7,
        name: 'Conference Table (8-seater)',
        tag: 'AST-0007',
        category: 'Office Furniture',
        status: 'Available',
        location: '2nd Floor — Room 204',
        dateAdded: '2023-07-22',
    },
    {
        id: 8,
        name: 'Digital Microscope',
        tag: 'AST-0008',
        category: 'Lab Equipment',
        status: 'Retired',
        location: 'Old Storage',
        dateAdded: '2019-05-01',
    },
];

const categoryOptions: AssetCategory[] = [
    'IT Equipment',
    'Vehicles',
    'Office Furniture',
    'Lab Equipment',
    'Audio/Visual',
];

const statusOptions: AssetStatus[] = [
    'Available',
    'Borrowed',
    'Under Repair',
    'Retired',
];

const categoryIcon: Record<AssetCategory, typeof Laptop> = {
    'IT Equipment': Laptop,
    Vehicles: Car,
    'Office Furniture': Armchair,
    'Lab Equipment': FlaskConical,
    'Audio/Visual': Video,
};

const statusStyles: Record<AssetStatus, string> = {
    Available:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Borrowed:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Under Repair':
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Retired:
        'bg-muted text-muted-foreground',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AssetStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
            {status}
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
    const Icon = categoryIcon[asset.category];

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
                        <p className="truncate text-xs text-muted-foreground">{asset.tag}</p>
                    </div>
                </div>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-foreground">{asset.category}</span>
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge status={asset.status} />
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">{asset.location}</span>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">{asset.dateAdded}</span>
            </td>
            <td className="py-3.5">
                <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(asset)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500"
                        aria-label={`Edit ${asset.name}`}
                    >
                        <Pencil className="size-4" />
                    </button>
                    <button
                        onClick={() => onDelete(asset)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                        aria-label={`Delete ${asset.name}`}
                    >
                        <Trash2 className="size-4" />
                    </button>
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
                            value={values.tag}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, tag: e.target.value }))
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
                                value={values.category}
                                onChange={(e) =>
                                    setValues((v) => ({
                                        ...v,
                                        category: e.target.value as AssetCategory,
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
                                        {s}
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
                            value={values.location}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, location: e.target.value }))
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
                            value={values.dateAdded}
                            onChange={(e) =>
                                setValues((v) => ({ ...v, dateAdded: e.target.value }))
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
                    ({asset.tag}) will be permanently removed from the inventory. This
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

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>(initialAssets);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'All' | AssetCategory>(
        'All',
    );
    const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');

    const [formOpen, setFormOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

    const filteredAssets = useMemo(() => {
        return assets.filter((a) => {
            const matchesSearch =
                search.trim() === '' ||
                a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.tag.toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                categoryFilter === 'All' || a.category === categoryFilter;
            const matchesStatus =
                statusFilter === 'All' || a.status === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [assets, search, categoryFilter, statusFilter]);

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
            // Update
            setAssets((prev) =>
                prev.map((a) =>
                    a.id === editingAsset.id ? { ...a, ...values } : a,
                ),
            );
        } else {
            // Create
            const nextId = Math.max(0, ...assets.map((a) => a.id)) + 1;
            setAssets((prev) => [...prev, { id: nextId, ...values }]);
        }
        closeFormModal();
    }

    function handleDeleteConfirm() {
        if (!deleteTarget) return;
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
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
                                onChange={(e) =>
                                    setCategoryFilter(
                                        e.target.value as 'All' | AssetCategory,
                                    )
                                }
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
                            tag: editingAsset.tag,
                            category: editingAsset.category,
                            status: editingAsset.status,
                            location: editingAsset.location,
                            dateAdded: editingAsset.dateAdded,
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