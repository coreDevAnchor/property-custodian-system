import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Armchair,
    ImageOff,
    Laptop,
    PackageSearch,
    Search,
    Video,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BorrowRequestDialog } from '@/components/borrow/borrow-request-dialog';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Asset {
    id: number;
    asset_tag: string;
    name: string;
    description?: string | null;
    photo?: string | null;
    acquisition_date?: string | null;
    condition?: number | null;

    category: {
        id: number;
        name: string;
    };

    location?: {
        id: number;
        name: string;
    } | null;
}

interface Category {
    id: number;
    name: string;
}

const categoryIcon: Record<string, typeof Laptop> = {
    Electronics: Laptop,
    Furniture: Armchair,
    'Office Equipment': Video,
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function AssetCard({
    asset,
    onRequest,
}: {
    asset: Asset;
    onRequest: (asset: Asset) => void;
}) {
    const Icon = categoryIcon[asset.category.name] ?? Laptop;

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
            <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted/30">
                {asset.photo ? (
                    <img
                        src={`/storage/${asset.photo}`}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Icon className="size-8" />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                    <p className="truncate text-sm font-semibold text-foreground">
                        {asset.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {asset.asset_tag} · {asset.category.name}
                    </p>
                </div>

                {asset.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                        {asset.description}
                    </p>
                )}

                <button
                    onClick={() => onRequest(asset)}
                    className="mt-auto flex h-9 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white transition-colors hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                >
                    Request to Borrow
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    assets: {
        data: Asset[];
    };
    categories: Category[];
}

export default function AvailableAssets({ assets, categories }: Props) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [requestTarget, setRequestTarget] = useState<Asset | undefined>();

    const filteredAssets = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        return (assets?.data ?? []).filter((asset) => {
            const matchesSearch =
                !searchTerm ||
                asset.name.toLowerCase().includes(searchTerm) ||
                asset.asset_tag.toLowerCase().includes(searchTerm) ||
                asset.category.name.toLowerCase().includes(searchTerm);

            const matchesCategory =
                categoryFilter === 'All' ||
                asset.category.id.toString() === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [assets, search, categoryFilter]);

    function handleSubmitRequest(assetId: number, remarks: string) {
        router.post(
            '/borrow-requests',
            { asset_id: assetId, remarks },
            {
                preserveScroll: true,
                onSuccess: () => setRequestTarget(undefined),
            }
        );
    }

    return (
        <>
            <Head title="Available Assets" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        Available Assets
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Browse equipment and submit a borrow request
                    </p>
                </div>

                {/* ── Filters ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or tag…"
                            className="h-10 w-full rounded-lg border border-border bg-background pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>

                    <Select
                        value={categoryFilter}
                        onValueChange={(value) => setCategoryFilter(value)}
                    >
                        <SelectTrigger className="w-[200px] cursor-pointer">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                >
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* ── Asset grid ── */}
                {filteredAssets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAssets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onRequest={setRequestTarget}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
                        <PackageSearch className="size-8 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">
                            No available assets found
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Try adjusting your search or filters
                        </p>
                    </div>
                )}
            </div>

            <BorrowRequestDialog
                asset={requestTarget}
                onOpenChange={(open) => !open && setRequestTarget(undefined)}
                onSubmit={handleSubmitRequest}
            />
        </>
    );
}