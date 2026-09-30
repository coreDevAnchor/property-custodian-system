import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Armchair, Laptop, PackageSearch, Search, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PolicyBadge } from '@/components/assets/asset-detail-panel';
import { cardVariants } from '@/components/assets/asset-table-animations';
import { AssetViewDialog } from '@/components/assets/assets-views-dialog';
import type { Asset } from '@/components/assets/types';
import { BorrowRequestDialog } from '@/components/borrow/borrow-request-dialog';
import { TakeSupplyDialog } from '@/components/borrow/take-supply-dialog';
import { AnimatedCardGrid } from '@/components/ui/animated-card-grid';
import { PaginationBar } from '@/components/ui/pagination';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { BorrowPolicy } from '@/types/categories';
import type { Paginated } from '@/types/pagination';

interface Category {
    id: number;
    name: string;
    borrow_policy?: BorrowPolicy;
}

interface Filters {
    search: string;
    category: string;
    per_page: number;
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
    onTake,
    onView,
}: {
    asset: Asset;
    onRequest: (asset: Asset) => void;
    onTake: (asset: Asset) => void;
    onView: (asset: Asset) => void;
}) {
    const Icon = asset.category
        ? (categoryIcon[asset.category.name] ?? Laptop)
        : Laptop;

    const isConsumable =
        asset.category?.borrow_policy === 'consumable';

    return (
        <motion.div
            variants={cardVariants}
            onClick={() => onView(asset)}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
        >
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
                    <div className="flex items-center gap-1.5">
                        <p className="min-w-0 truncate text-xs text-muted-foreground">
                            {asset.asset_tag} ·{' '}
                            {asset.category?.name ?? 'Unspecified'}
                        </p>

                        {isConsumable ? (
                            <span className="shrink-0">
                                <PolicyBadge
                                    policy="consumable"
                                    size="xs"
                                />
                            </span>
                        ) : (
                            <span className="shrink-0">
                                <PolicyBadge
                                    policy="returnable"
                                    size="xs"
                                />
                            </span>
                        )}
                    </div>
                </div>

                {asset.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                        {asset.description}
                    </p>
                )}

                {isConsumable ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTake(asset);
                        }}
                        className="mt-auto flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white transition-colors hover:bg-emerald-600 active:scale-[0.98]"
                    >
                        Take Supply
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequest(asset);
                        }}
                        className="mt-auto flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white transition-colors hover:bg-orange-600 active:scale-[0.98]"
                    >
                        Request to Borrow
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    assets: Paginated<Asset>;
    categories: Category[];
    filters: Filters;
}

export default function AvailableAssets({
    assets,
    categories,
    filters = { search: '', category: 'All', per_page: 12 },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState<string>(
        filters.category ?? 'All',
    );
    const [requestTarget, setRequestTarget] = useState<Asset | undefined>();
    const [takeTarget, setTakeTarget] = useState<Asset | undefined>();
    const [viewTarget, setViewTarget] = useState<Asset | undefined>();
    const [loading, setLoading] = useState(false);

    // ── Server-driven filtering/pagination ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchRef = useRef(search);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        setLoading(true);

        router.get(
            '/employee/assets',
            {
                search: overrides.search ?? search,
                category: overrides.category ?? categoryFilter,
                per_page: overrides.per_page ?? assets.per_page,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['assets', 'filters'],
                onFinish: () => setLoading(false),
                onError: () => setLoading(false),
            },
        );
    }

    useEffect(() => {
        if (searchRef.current === search) {
            return;
        }

        searchRef.current = search;

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

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    function handleSubmitRequest(
        assetId: number,
        expectedReturnDate: string,
        remarks: string,
        borrowAmount?: number,
    ) {
        router.post(
            '/employee/borrow-requests',
            {
                asset_id: assetId,
                expected_return_date: expectedReturnDate,
                remarks,
                borrow_amount: borrowAmount,
            },
            {
                preserveScroll: true,
                onSuccess: () => setRequestTarget(undefined),
            },
        );
    }

    function handleTake(assetId: number, amount: number, remarks: string) {
        router.post(
            '/employee/consumables/take',
            {
                asset_id: assetId,
                amount,
                remarks,
            },
            {
                preserveScroll: true,
                onSuccess: () => setTakeTarget(undefined),
            },
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

                {/* ── Filters + grid + pagination ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or tag…"
                                className="h-10 w-full rounded-lg border border-border bg-background pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="w-[200px]">
                            <SearchableSelect
                                placeholder="Select category"
                                selectedId={
                                    categoryFilter === 'All'
                                        ? 0
                                        : Number(categoryFilter)
                                }
                                options={[
                                    { id: 0, name: 'All Categories' },
                                    ...categories.map((category) => ({
                                        id: category.id,
                                        name: category.name,
                                        secondary:
                                            category.borrow_policy ===
                                            'consumable'
                                                ? 'Consumable'
                                                : 'Returnable',
                                    })),
                                ]}
                                onSelect={(id) =>
                                    handleCategoryChange(
                                        id === 0 ? 'All' : String(id),
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        {assets.data.length > 0 ? (
                            <AnimatedCardGrid
                                loading={loading}
                                animate
                                animationKey={`${categoryFilter}-${assets.current_page}`}
                                gridClass="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                            >
                                {assets.data.map((asset) => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onRequest={setRequestTarget}
                                        onTake={setTakeTarget}
                                        onView={setViewTarget}
                                    />
                                ))}
                            </AnimatedCardGrid>
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-16 text-center">
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

            <BorrowRequestDialog
                asset={requestTarget}
                onOpenChange={(open) => !open && setRequestTarget(undefined)}
                onSubmit={handleSubmitRequest}
            />

            <TakeSupplyDialog
                asset={takeTarget}
                onOpenChange={(open) => !open && setTakeTarget(undefined)}
                onSubmit={handleTake}
            />

            <AssetViewDialog
                key={viewTarget?.id}
                open={!!viewTarget}
                asset={viewTarget}
                onOpenChange={(open) => !open && setViewTarget(undefined)}
                readOnly
            />
        </>
    );
}
