import { Head, router } from '@inertiajs/react';
import {
    Check,
    ClipboardCheck,
    Clock,
    CalendarClock,
    PackageCheck,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { update as updateRenewal } from '@/actions/App/Http/Controllers/BorrowRenewalController';
import { BorrowApprovalDialog } from '@/components/borrow/borrow-approval-dialog';
import { BorrowRejectionDialog } from '@/components/borrow/borrow-rejection-dialog';
import { PaginationBar } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes/custodian';
import { borrowStatusLabels, borrowStatusStyles } from '@/types/borrow-status';
import type {
    BorrowStatus,
    SortKey,
    BorrowRequest,
    BorrowRenewalRequest,
    Filters
} from '@/types/borrows';
import type { Paginated } from '@/types/pagination';
import { motion } from "framer-motion";
import { AnimatedTableBody } from "@/components/ui/animated-table-body";
import { rowVariants } from "@/components/assets/asset-table-animations";
import { useInertiaLoading } from "@/hooks/use-inertia-loading"

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BorrowStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${borrowStatusStyles[status]}`}
        >
            {borrowStatusLabels[status]}
        </span>
    );
}


function BorrowRequestRow({
    request,
    onUpdateStatus,
}: {
    request: BorrowRequest;
    onUpdateStatus: (request: BorrowRequest, status: BorrowStatus) => void;
}) {
    return (
        <motion.tr
            variants={rowVariants}
            className="group border-b border-border transition-colors last:border-0 hover:bg-muted/50"
        >
            <td className="py-3.5 pr-4">
                <p className="truncate text-sm font-semibold text-foreground">
                    {request.borrower?.name ?? 'Unknown borrower'}
                </p>
                {request.remarks && (
                    <p className="truncate text-xs text-muted-foreground">
                        {request.remarks}
                    </p>
                )}
            </td>
            <td className="py-3.5 pr-4">
                <p className="truncate text-sm text-foreground">
                    {request.asset.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {request.asset.asset_tag} · {request.asset.category.name}
                </p>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">
                    {new Date(request.requested_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge status={request.status} />
            </td>
            <td className="py-3.5">
                <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {request.status === 'pending' && (
                        <>
                            <button
                                onClick={() => onUpdateStatus(request, 'borrowed')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                                aria-label={`Approve request from ${request.borrower?.name ?? 'Unknown borrower'}`}
                                title="Approve"
                            >
                                <Check className="size-4" />
                            </button>
                            <button
                                onClick={() => onUpdateStatus(request, 'rejected')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                aria-label={`Reject request from ${request.borrower?.name ?? 'Unknown borrower'}`}
                                title="Reject"
                            >
                                <X className="size-4" />
                            </button>
                        </>
                    )}

                    {request.status === 'borrowed' && (
                        <button
                            onClick={() => onUpdateStatus(request, 'awaiting_check')}
                            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-purple-500/10 hover:text-purple-500 cursor-pointer"
                            title="Mark as awaiting check"
                        >
                            <ClipboardCheck className="size-3.5" />
                            Awaiting Check
                        </button>
                    )}

                    {request.status === 'awaiting_check' && (
                        <button
                            onClick={() => onUpdateStatus(request, 'returned')}
                            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                            title="Confirm return"
                        >
                            <PackageCheck className="size-3.5" />
                            Confirm Return
                        </button>
                    )}

                    {(request.status === 'returned' ||
                        request.status === 'rejected') && (
                            <span className="text-xs text-muted-foreground">—</span>
                        )}
                </div>
            </td>
        </motion.tr>
    );
}



// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    borrowRequests: Paginated<BorrowRequest>;
    pendingCount: number;
    renewalRequests: BorrowRenewalRequest[];
    pendingRenewalCount: number;
    filters: Filters;
}

export default function BorrowRequests({
    borrowRequests,
    pendingCount,
    renewalRequests,
    pendingRenewalCount,
    filters = { search: '', status: 'pending', sort: 'newest', per_page: 10 },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<'All' | BorrowStatus>(filters.status ?? 'pending');
    const [sortKey, setSortKey] = useState<SortKey>(filters.sort ?? 'newest');
    const [approvalRequest, setApprovalRequest] = useState<BorrowRequest | null>(null);
    const [rejectionRequest, setRejectionRequest] = useState<BorrowRequest | null>(null);
    const [view, setView] = useState<'borrows' | 'renewals'>('borrows');
    const [loading, setLoading] = useState(false);
    const animationKey = `${borrowRequests.current_page}-${search}-${statusFilter}-${sortKey}`;
    const renewalAnimationKey = `${renewalRequests.length}-${pendingRenewalCount}`;

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        setLoading(true);

        router.get(
            '/custodian/borrow-requests',
            {
                search: overrides.search ?? search,
                status: overrides.status ?? statusFilter,
                sort: overrides.sort ?? sortKey,
                per_page: overrides.per_page ?? borrowRequests.per_page,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['borrowRequests', 'pendingCount', 'filters'],
                onFinish: () => setLoading(false),
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

    function handleStatusChange(value: 'All' | BorrowStatus) {
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

    function handleUpdateStatus(
        request: BorrowRequest,
        status: BorrowStatus,
        expectedReturnDate?: string,
        rejectionMessage?: string,
    ) {
        if (status === 'borrowed' && !expectedReturnDate) {
            setApprovalRequest(request);

            return;
        }

        if (status === 'rejected' && rejectionMessage === undefined) {
            setRejectionRequest(request);

            return;
        }

        router.put(
            `/custodian/borrow-requests/${request.id}`,
            {
                status,
                expected_return_date: expectedReturnDate,
                rejection_message: rejectionMessage,
            },
            { preserveScroll: true }
        );
    }

    function handleRenewalDecision(
        renewal: BorrowRenewalRequest,
        status: 'approved' | 'rejected',
    ) {
        router.patch(updateRenewal.url(renewal.id), { status }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Borrow Requests" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Borrow Requests
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and manage employee borrow requests
                        </p>
                    </div>

                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Clock className="size-4" />
                            {pendingCount} pending
                        </div>
                    )}
                </div>

                {/* ── Filters + table ── */}
                <Tabs value={view} onValueChange={(value) => setView(value as 'borrows' | 'renewals')}>
                    <TabsList>
                        <TabsTrigger value="borrows" className="cursor-pointer">
                            Borrow Requests
                            {pendingCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {pendingCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="renewals" className="cursor-pointer">
                            Renewal Requests
                            {pendingRenewalCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingRenewalCount}</span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${view === 'borrows' ? '' : 'hidden'}`}>
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by requester or asset…"
                                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
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
                                    <SelectItem value="requester_az">
                                        Requester A–Z
                                    </SelectItem>
                                    <SelectItem value="requester_za">
                                        Requester Z–A
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Requester
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Asset
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Requested
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <AnimatedTableBody
                                loading={loading}
                                animate
                                animationKey={animationKey}
                            >
                                {borrowRequests.data.map((request) => (
                                    <BorrowRequestRow
                                        key={request.id}
                                        request={request}
                                        onUpdateStatus={handleUpdateStatus}
                                    />
                                ))}
                            </AnimatedTableBody>
                        </table>

                        {borrowRequests.data.length === 0 && (
                            <div className="flex flex-col items-center gap-1 py-12 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    No borrow requests found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        )}
                    </div>

                    <PaginationBar
                        currentPage={borrowRequests.current_page}
                        lastPage={borrowRequests.last_page}
                        total={borrowRequests.total}
                        from={borrowRequests.from}
                        to={borrowRequests.to}
                        perPage={borrowRequests.per_page}
                        itemLabel="requests"
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                </div>

                <div className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${view === 'renewals' ? '' : 'hidden'}`}>
                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Requester</th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Asset</th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Current / Requested Due</th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reason</th>
                                    <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                </tr>
                            </thead>

                            <AnimatedTableBody
                                loading={loading}
                                animate
                                animationKey={renewalAnimationKey}
                            >

                                {renewalRequests.map((renewal) => (
                                    <motion.tr
                                        key={renewal.id}
                                        variants={rowVariants}
                                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                                    >
                                        <td className="py-3.5 pr-4 text-sm font-semibold text-foreground">{renewal.borrow.borrower?.name ?? 'Unknown borrower'}</td>
                                        <td className="py-3.5 pr-4"><p className="text-sm text-foreground">{renewal.borrow.asset.name}</p><p className="text-xs text-muted-foreground">{renewal.borrow.asset.asset_tag}</p></td>
                                        <td className="py-3.5 pr-4 text-sm text-muted-foreground">{renewal.borrow.expected_return_date ? new Date(renewal.borrow.expected_return_date).toLocaleDateString() : '—'} → {new Date(renewal.requested_due_date).toLocaleDateString()}</td>
                                        <td className="max-w-xs py-3.5 pr-4 text-sm text-muted-foreground">{renewal.reason}</td>
                                        <td className="py-3.5"><div className="flex items-center gap-2">
                                            <button onClick={() => handleRenewalDecision(renewal, 'approved')} className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/10"><Check className="size-3.5" /> Approve</button>
                                            <button onClick={() => handleRenewalDecision(renewal, 'rejected')} className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10"><X className="size-3.5" /> Reject</button>
                                        </div></td>
                                    </motion.tr>
                                ))}
                            </AnimatedTableBody>
                        </table>
                        {renewalRequests.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <CalendarClock className="size-6 text-muted-foreground" />
                                <p className="text-sm font-semibold text-foreground">No pending renewal requests</p>
                                <p className="text-xs text-muted-foreground">New extension requests will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            <BorrowApprovalDialog
                request={approvalRequest}
                onClose={() => setApprovalRequest(null)}
                onConfirm={(expectedReturnDate) => {
                    if (approvalRequest) {
                        handleUpdateStatus(approvalRequest, 'borrowed', expectedReturnDate);
                    }

                    setApprovalRequest(null);
                }}
            />

            <BorrowRejectionDialog
                request={rejectionRequest}
                onClose={() => setRejectionRequest(null)}
                onConfirm={(message) => {
                    if (rejectionRequest) {
                        handleUpdateStatus(rejectionRequest, 'rejected', undefined, message);
                    }

                    setRejectionRequest(null);
                }}
            />
        </>
    );
}

BorrowRequests.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Borrow Requests',
            href: '/custodian/borrow-requests',
        },
    ],
};
