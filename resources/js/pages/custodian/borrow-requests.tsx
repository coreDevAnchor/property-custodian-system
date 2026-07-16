import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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

// ─── Types ──────────────────────────────────────────────────────────────────

type BorrowStatus =
    | 'pending'
    | 'borrowed'
    | 'awaiting_check'
    | 'returned'
    | 'rejected';

interface BorrowRequest {
    id: number;
    status: BorrowStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    returned_at?: string | null;
    expected_return_date?: string | null;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: {
            id: number;
            name: string;
        };
    };

    employee: {
        id: number;
        user: {
            name: string;
        };
    };

    approved_by?: {
        id: number;
        name: string;
    } | null;

    checked_by?: {
        id: number;
        name: string;
    } | null;
}

type SortKey = 'newest' | 'oldest' | 'requester_az' | 'requester_za';

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
                    {request.employee.user.name}
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
                                aria-label={`Approve request from ${request.employee.user.name}`}
                                title="Approve"
                            >
                                <Check className="size-4" />
                            </button>
                            <button
                                onClick={() => onUpdateStatus(request, 'rejected')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                aria-label={`Reject request from ${request.employee.user.name}`}
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
    borrowRequests: {
        data: BorrowRequest[];
    };
}

export default function BorrowRequests({ borrowRequests }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | BorrowStatus>('pending');
    const [sortKey, setSortKey] = useState<SortKey>('newest');
    const [approvalRequest, setApprovalRequest] = useState<BorrowRequest | null>(null);

    const filteredRequests = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        const filtered = (borrowRequests?.data ?? []).filter((request) => {
            const matchesSearch =
                !searchTerm ||
                request.employee.user.name.toLowerCase().includes(searchTerm) ||
                request.asset.name.toLowerCase().includes(searchTerm) ||
                request.asset.asset_tag.toLowerCase().includes(searchTerm);

            const matchesStatus =
                statusFilter === 'All' || request.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return [...filtered].sort((a, b) => {
            switch (sortKey) {
                case 'newest':
                    return (
                        new Date(b.requested_at).getTime() -
                        new Date(a.requested_at).getTime()
                    );
                case 'oldest':
                    return (
                        new Date(a.requested_at).getTime() -
                        new Date(b.requested_at).getTime()
                    );
                case 'requester_az':
                    return a.employee.user.name.localeCompare(
                        b.employee.user.name
                    );
                case 'requester_za':
                    return b.employee.user.name.localeCompare(
                        a.employee.user.name
                    );
                default:
                    return 0;
            }
        });
    }, [borrowRequests, search, statusFilter, sortKey]);

    const pendingCount = useMemo(
        () =>
            (borrowRequests?.data ?? []).filter((r) => r.status === 'pending')
                .length,
        [borrowRequests]
    );

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
                                value={statusFilter}
                                onValueChange={(value) =>
                                    setStatusFilter(value as "All" | BorrowStatus)
                                }
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="borrowed">Borrowed</SelectItem>
                                    <SelectItem value="awaiting_check">
                                        Awaiting Check
                                    </SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={sortKey}
                                onValueChange={(value) => setSortKey(value as SortKey)}
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
                                {filteredRequests.map((request) => (
                                    <BorrowRequestRow
                                        key={request.id}
                                        request={request}
                                        onUpdateStatus={handleUpdateStatus}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {filteredRequests.length === 0 && (
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

                    <div className="flex items-center justify-between border-t border-border px-6 py-3.5">
                        <p className="text-xs text-muted-foreground">
                            Showing {filteredRequests.length} of{' '}
                            {borrowRequests?.data?.length ?? 0} requests
                        </p>
                    </div>
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