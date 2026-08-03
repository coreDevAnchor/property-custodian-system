import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarClock,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Package,
    PackageOpen,
    PackageX,
} from 'lucide-react';
import { useState } from 'react';
import { BorrowRenewalDialog } from '@/components/borrow/borrow-renewal-dialog';
import { LostAssetDialog } from '@/components/lost/lost-asset-dialog';
import { ReturnRequestDialog } from '@/components/return/return-request-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationBar } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    BorrowItem,
    BorrowCounts,
    CurrentBorrowFilters,
    ActiveBorrowStatus,
} from '@/types/borrows';
import type { Paginated } from '@/types/pagination';

interface Props {
    borrows: Paginated<BorrowItem>;
    borrowCounts: BorrowCounts;
    filters: CurrentBorrowFilters;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(value?: string | null) {
    if (!value) {
return null;
}

    const d = new Date(value);

    if (isNaN(d.getTime())) {
return value;
}

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function daysUntil(value?: string | null): number | null {
    if (!value) {
return null;
}

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(value);
    due.setHours(0, 0, 0, 0);

    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const statusConfig: Record<
    ActiveBorrowStatus,
    { label: string; icon: typeof Clock; color: string; dot: string }
> = {
    pending: {
        label: 'Pending Approval',
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-400',
    },
    borrowed: {
        label: 'Currently Borrowed',
        icon: CheckCircle2,
        color: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-400',
    },
    awaiting_check: {
        label: 'Awaiting Inspection',
        icon: AlertCircle,
        color: 'text-purple-600 dark:text-purple-400',
        dot: 'bg-purple-400',
    },
};

function DueDateBadge({ date }: { date?: string | null }) {
    const days = daysUntil(date);

    if (days === null) {
return null;
}

    let cls: string;
    let label: string;

    if (days < 0) {
        cls = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        label = `${Math.abs(days)}d overdue`;
    } else if (days === 0) {
        cls = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        label = 'Due today';
    } else if (days <= 3) {
        cls = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        label = `${days}d left`;
    } else {
        cls = 'bg-muted text-muted-foreground';
        label = `${days}d left`;
    }

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
            <CalendarClock className="size-3" />
            {label}
        </span>
    );
}



function BorrowCard({ item }: { item: BorrowItem }) {
    const { label, icon: Icon, color, dot } = statusConfig[item.status as ActiveBorrowStatus];
    const canReturn = item.status === 'borrowed';
    const [openReturnDialog, setOpenReturnDialog] = useState(false);
    const [openRenewalDialog, setOpenRenewalDialog] = useState(false);
    const [lostAsset, setLostAsset] = useState<BorrowItem | null>(null);
    const [submittingLost, setSubmittingLost] = useState(false);
    const [openLostDialog, setOpenLostDialog] = useState(false);

    function handleLostSubmit(borrowId: number, reason: string) {
        setSubmittingLost(true);

        router.post(
            '/employee/returns',
            {
                lost_id: borrowId,
                lost_reason: reason,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setOpenLostDialog(false);
                },

                onFinish: () => {
                    setSubmittingLost(false);
                },
            },
        );
    }



    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            {/* Photo / placeholder strip */}
            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-muted/40">
                {item.asset.photo ? (
                    <img
                        src={`/storage/${item.asset.photo}`}
                        alt={item.asset.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <Package className="size-12 text-muted-foreground/40" />
                )}

                {/* Status pill overlay */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 shadow-sm`}>
                    <span className={`size-2 rounded-full ${dot} animate-pulse`} />
                    <span className={`text-[11px] font-bold ${color}`}>{label}</span>
                </div>

                {canReturn && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Actions for ${item.asset.name}`}
                            >
                                <MoreHorizontal className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => setOpenRenewalDialog(true)}>
                                <CalendarClock />
                                Request extension
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setOpenLostDialog(true)}
                            >
                                <PackageX />
                                Report as lost
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Asset name + tag */}
                <div>
                    <p className="truncate text-base font-bold text-foreground leading-tight">
                        {item.asset.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{item.asset.asset_tag}</span>
                        {' · '}
                        {item.asset.category.name}
                    </p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Requested</p>
                        <p className="font-medium text-foreground">{fmtDate(item.requested_at)}</p>
                    </div>
                    {item.approved_at && (
                        <div>
                            <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Approved</p>
                            <p className="font-medium text-foreground">{fmtDate(item.approved_at)}</p>
                        </div>
                    )}
                    {item.asset.location && (
                        <div className="col-span-2">
                            <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Location</p>
                            <p className="font-medium text-foreground">{item.asset.location.name}</p>
                        </div>
                    )}
                </div>

                {/* Due date badge */}
                {item.status === 'borrowed' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Due:</span>
                        <DueDateBadge date={item.expected_return_date} />
                    </div>
                )}

                {/* Remarks */}
                {item.remarks && (
                    <p className="line-clamp-2 rounded-lg bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
                        &ldquo;{item.remarks}&rdquo;
                    </p>
                )}

                {/* Return action */}
                {canReturn && (
                    <div className="mt-auto">
                        <button
                            onClick={() => setOpenReturnDialog(true)}
                            className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                            Return Asset
                        </button>
                    </div>

                )}

                {item.status === 'pending' && (
                    <div className="mt-auto flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/60 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="size-3.5" />
                        Waiting for custodian approval
                    </div>
                )}

                {item.status === 'awaiting_check' && (
                    <div className="mt-auto flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-400/60 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        <AlertCircle className="size-3.5" />
                        Under custodian inspection
                    </div>
                )}
            </div>

            <BorrowRenewalDialog
                open={openRenewalDialog}
                onOpenChange={setOpenRenewalDialog}
                borrowId={item.id}
                currentDueDate={item.expected_return_date}
                assetName={item.asset.name}
                assetTag={item.asset.asset_tag}
                onSubmit={(borrowId, requestedDueDate, reason) => {
                    router.post(
                        '/employee/borrow-renewals',
                        {
                            borrow_id: borrowId,
                            requested_due_date: requestedDueDate,
                            reason,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                setOpenRenewalDialog(false);
                            },
                        }
                    );
                }}
            />

            <ReturnRequestDialog
                open={openReturnDialog}
                onOpenChange={setOpenReturnDialog}
                items={[
                    {
                        id: item.id,
                        requested_at: item.requested_at,
                        asset: {
                            id: item.asset.id,
                            name: item.asset.name,
                            asset_tag: item.asset.asset_tag,
                            category: item.asset.category,
                        },
                    },
                ]}
            />

            <LostAssetDialog
                open={openLostDialog}
                onOpenChange={setOpenLostDialog}
                borrowId={item.id}
                assetName={item.asset.name}
                assetTag={item.asset.asset_tag}
                submitting={submittingLost}
                onSubmit={handleLostSubmit}
            />
        </article>

    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const statusFilterOptions: { value: 'All' | ActiveBorrowStatus; label: string }[] = [
    { value: 'All', label: 'All Statuses' },
    { value: 'borrowed', label: 'Currently Borrowed' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'awaiting_check', label: 'Under Inspection' },
];

export default function CurrentBorrows({
    borrows,
    borrowCounts,
    filters = { status: 'All', per_page: 12 },
}: Props) {
    const [status, setStatus] = useState<'All' | ActiveBorrowStatus>(filters.status ?? 'All');

    const isEmpty = borrows.total === 0;

    function fetchPage(page: number, overrides: Partial<CurrentBorrowFilters> = {}) {
        router.get(
            '/employee/current-borrows',
            {
                status: overrides.status ?? status,
                per_page: overrides.per_page ?? borrows.per_page,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['borrows', 'filters', 'borrowCounts'],
            },
        );
    }

    function handleStatusChange(value: 'All' | ActiveBorrowStatus) {
        setStatus(value);
        fetchPage(1, { status: value });
    }

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    return (
        <>
            <Head title="My Current Borrows" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            My Current Borrows
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Assets you currently have in your possession or pending approval
                        </p>
                    </div>

                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[220px] cursor-pointer">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusFilterOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[
                        {
                            label: 'Active',
                            count: borrowCounts.borrowed,
                            color: 'text-emerald-600 dark:text-emerald-400',
                            bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Pending',
                            count: borrowCounts.pending,
                            color: 'text-amber-600 dark:text-amber-400',
                            bg: 'bg-amber-500/10 dark:bg-amber-500/20',
                            icon: Clock,
                        },
                        {
                            label: 'Inspection',
                            count: borrowCounts.awaiting_check,
                            color: 'text-purple-600 dark:text-purple-400',
                            bg: 'bg-purple-500/10 dark:bg-purple-500/20',
                            icon: AlertCircle,
                        },
                    ].map(({ label, count, color, bg, icon: Ico }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                        >
                            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                                <Ico className={`size-4 ${color}`} />
                            </div>
                            <div>
                                <p className={`text-xl font-extrabold leading-none ${color}`}>{count}</p>
                                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Card grid + pagination ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="px-6 py-6">
                        {isEmpty ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
                                    <PackageOpen className="size-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground">
                                        No active borrows
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        You have no assets currently borrowed or awaiting approval.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {borrows.data.map((item) => (
                                    <BorrowCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                    </div>

                    {!isEmpty && (
                        <PaginationBar
                            currentPage={borrows.current_page}
                            lastPage={borrows.last_page}
                            total={borrows.total}
                            from={borrows.from}
                            to={borrows.to}
                            perPage={borrows.per_page}
                            itemLabel="borrows"
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                        />
                    )}
                </div>
            </div>
        </>
    );
}