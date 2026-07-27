import { Head, router } from '@inertiajs/react';
import {
    Check,
    ClipboardCheck,
    Clock,
    PackageCheck,
    Search,
    X,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { dashboard } from '@/routes/custodian';
import { BorrowApprovalDialog } from '@/components/borrow/borrow-approval-dialog';
import { PaginationBar } from '@/components/ui/pagination';
import { useEffect, useRef, useState } from 'react';
import { Paginated } from '@/types/pagination';
import {
    BorrowStatus,
    SortKey,
    BorrowRequest,
    Filters
} from '@/types/borrows';

const statusLabels: Record<BorrowStatus, string> = {
    pending: 'Pending',
    borrowed: 'Borrowed',
    awaiting_check: 'Awaiting Check',
    returned: 'Returned',
    rejected: 'Rejected',
};

const statusStyles: Record<BorrowStatus, string> = {
    pending:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    borrowed:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    awaiting_check:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    returned:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BorrowStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
            {statusLabels[status]}
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
        <tr className="group border-b border-border transition-colors last:border-0 hover:bg-muted/50">
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
        </tr>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    borrowRequests: Paginated<BorrowRequest>;
    pendingCount: number;
    filters: Filters;
}

export default function BorrowRequests({
    borrowRequests,
    pendingCount,
    filters = { search: '', status: 'pending', sort: 'newest', per_page: 10 },
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<'All' | BorrowStatus>(filters.status ?? 'pending');
    const [sortKey, setSortKey] = useState<SortKey>(filters.sort ?? 'newest');
    const [approvalRequest, setApprovalRequest] = useState<BorrowRequest | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        router.get(
            '/custodian/borrow-requests',
            {
                search: overrides.search ?? search,
                status: overrides.status ?? statusFilter,
                sort: overrides.sort ?? sortKey,
                per_page: overrides.per_page ?? borrowRequests.per_page,
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['borrowRequests', 'pendingCount', 'filters'] },
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
        expectedReturnDate?: string
    ) {
        if (status === 'borrowed' && !expectedReturnDate) {
            setApprovalRequest(request);
            return;
        }

        router.put(
            `/custodian/borrow-requests/${request.id}`,
            {
                status,
                expected_return_date: expectedReturnDate,
            },
            { preserveScroll: true }
        );
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
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
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
                            <tbody>
                                {borrowRequests.data.map((request) => (
                                    <BorrowRequestRow
                                        key={request.id}
                                        request={request}
                                        onUpdateStatus={handleUpdateStatus}
                                    />
                                ))}
                            </tbody>
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
            </div>

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
