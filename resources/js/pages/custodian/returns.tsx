import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    PackageX,
    Search,
    ShieldCheck,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes/custodian';
import { PaginationBar } from '@/components/ui/pagination';
import { LostConfirmDialog } from '@/components/dialog/lost-confirm-dialog';
import { Paginated } from '@/types/pagination';
import type {
    ReturnStatus,
    ReturnCondition,
    ReturnItem,
    SortKey,
    Filters
} from '@/types/returns';

import { motion } from "framer-motion";
import { AnimatedTableBody } from "@/components/ui/animated-table-body";
import { rowVariants } from "@/components/assets/asset-table-animations";

const statusLabels: Record<ReturnStatus, string> = {
    awaiting_check: 'Awaiting Check',
    returned: 'Returned',
};

const statusStyles: Record<ReturnStatus, string> = {
    awaiting_check:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    returned:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const conditionLabels: Record<ReturnCondition, string> = {
    ok: 'Good Condition',
    defective: 'Defective',
    lost: 'Lost',
};

const conditionStyles: Record<ReturnCondition, string> = {
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    defective: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    lost: 'bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
};

const conditionIcons: Record<ReturnCondition, typeof CheckCircle2> = {
    ok: CheckCircle2,
    defective: AlertTriangle,
    lost: PackageX,
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReturnStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

function ConditionBadge({ condition }: { condition: ReturnCondition }) {
    const Icon = conditionIcons[condition];

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${conditionStyles[condition]}`}
        >
            <Icon className="size-3" />
            {conditionLabels[condition]}
        </span>
    );
}

function ReturnRow({
    item,
    onConfirmReturn,
}: {
    item: ReturnItem;
    onConfirmReturn: (item: ReturnItem, condition: ReturnCondition) => void;
}) {
    return (
        <motion.tr
            variants={rowVariants}
            className="group border-b border-border transition-colors last:border-0 hover:bg-muted/50">
            <td className="py-3.5 pr-4">
                <p className="truncate text-sm font-semibold text-foreground">
                    {item.borrower?.name ?? "Unknown Employee"}
                </p>
                {item.remarks && (
                    <p className="truncate text-xs text-muted-foreground">
                        {item.remarks}
                    </p>
                )}
            </td>
            <td className="py-3.5 pr-4">
                <p className="truncate text-sm text-foreground">{item.asset.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {item.asset.asset_tag} · {item.asset.category.name}
                </p>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">
                    {item.returned_at
                        ? new Date(item.returned_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })
                        : '—'}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge status={item.status} />
            </td>
            <td className="py-3.5 pr-4">
                {item.return_condition ? (
                    <ConditionBadge condition={item.return_condition} />
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                )}
            </td>

            <td className="py-3.5 pr-4">
                {item.checked_by ? (
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            {item.checked_by.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        —
                    </span>
                )}
            </td>
            <td className="py-3.5">
                {item.status === 'awaiting_check' ? (
                    item.return_condition === 'lost' ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onConfirmReturn(item, 'lost')}
                                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-700 cursor-pointer dark:text-red-400 dark:hover:text-red-300"
                                title="Review and confirm this asset as lost"
                            >
                                <PackageX className="size-3.5" />
                                Confirm Lost
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                onClick={() => onConfirmReturn(item, 'ok')}
                                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                                title="Confirm return in good condition"
                            >
                                <CheckCircle2 className="size-3.5" />
                                Good
                            </button>

                            <button
                                onClick={() => onConfirmReturn(item, 'defective')}
                                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                title="Confirm return as defective"
                            >
                                <AlertTriangle className="size-3.5" />
                                Defective
                            </button>
                        </div>
                    )
                ) : (
                    <span className="text-xs text-muted-foreground">
                        {item.is_acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                    </span>
                )}
            </td>
        </motion.tr>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    returns: Paginated<ReturnItem>;
    awaitingCount: number;
    filters: Filters;
}

export default function Returns({
    returns,
    awaitingCount,
    filters = { search: '', status: 'awaiting_check', sort: 'newest', per_page: 10 },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<'All' | ReturnStatus>(filters.status ?? 'awaiting_check');
    const [sortKey, setSortKey] = useState<SortKey>(filters.sort ?? 'newest');
    const [lostConfirmItem, setLostConfirmItem] = useState<ReturnItem | null>(null);
    const [loading, setLoading] = useState(false);
    const animationKey = `${returns.current_page}-${search}-${statusFilter}-${sortKey}`;

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        setLoading(true);

        router.get(
            "/custodian/returns",
            {
                search: overrides.search ?? search,
                status: overrides.status ?? statusFilter,
                sort: overrides.sort ?? sortKey,
                per_page: overrides.per_page ?? returns.per_page,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["returns", "awaitingCount", "filters"],

                onFinish: () => setLoading(false),
            }
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

    function handleStatusChange(value: 'All' | ReturnStatus) {
        setStatusFilter(value);
        fetchPage(1, { status: value });
    }

    function handleSortChange(value: SortKey) {
        setSortKey(value);
        fetchPage(1, { sort: value });
    }

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    function handleConfirmReturn(item: ReturnItem, condition: ReturnCondition) {
        if (condition === 'lost') {
            setLostConfirmItem(item);
            return;
        }
        submitConfirmReturn(item, condition);
    }

    function submitConfirmReturn(
        item: ReturnItem,
        condition: ReturnCondition
    ) {
        setLoading(true);

        router.put(
            `/custodian/returns/${item.id}`,
            {
                return_condition: condition,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLostConfirmItem(null);
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    }

    return (
        <>
            <Head title="Returns" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Returns
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Inspect and confirm returned assets
                        </p>
                    </div>

                    {awaitingCount > 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <ClipboardCheck className="size-4" />
                            {awaitingCount} awaiting check
                        </div>
                    )}
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
                                placeholder="Search by borrower or asset…"
                                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={statusFilter}
                                onValueChange={(value) =>
                                    handleStatusChange(value as 'All' | ReturnStatus)
                                }
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="awaiting_check">
                                        Awaiting Check
                                    </SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={sortKey}
                                onValueChange={(value) => handleSortChange(value as SortKey)}
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="borrower_az">
                                        Borrower A–Z
                                    </SelectItem>
                                    <SelectItem value="borrower_za">
                                        Borrower Z–A
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[820px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Borrower
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Asset
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Returned
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Condition
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Checked By
                                    </th>
                                    <th className="py-3 text-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <AnimatedTableBody
                                loading={loading}
                                animate
                                animationKey={animationKey}
                            >
                                {returns.data.map((item) => (
                                    <ReturnRow
                                        key={item.id}
                                        item={item}
                                        onConfirmReturn={handleConfirmReturn}
                                    />
                                ))}
                            </AnimatedTableBody>
                        </table>

                        {returns.data.length === 0 && (
                            <div className="flex flex-col items-center gap-1 py-12 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    No returns found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        )}
                    </div>

                    <PaginationBar
                        currentPage={returns.current_page}
                        lastPage={returns.last_page}
                        total={returns.total}
                        from={returns.from}
                        to={returns.to}
                        perPage={returns.per_page}
                        itemLabel="returns"
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                </div>
            </div>

            <LostConfirmDialog
                open={!!lostConfirmItem}
                onOpenChange={(open) => {
                    if (!open) {
                        setLostConfirmItem(null);
                    }
                }}
                assetNames={
                    lostConfirmItem
                        ? `"${lostConfirmItem.asset.name}" (${lostConfirmItem.asset.asset_tag})`
                        : ''
                }
                lostReason={lostConfirmItem?.lost_reason}
                onConfirm={() => {
                    if (lostConfirmItem) {
                        submitConfirmReturn(lostConfirmItem, 'lost');
                        setLostConfirmItem(null);
                    }
                }}
            />
        </>
    );
}

Returns.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Returns',
            href: '/custodian/returns',
        },
    ],
};