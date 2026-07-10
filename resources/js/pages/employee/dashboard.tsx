import { Head, Link } from '@inertiajs/react';
import {
    Box,
    Clock,
    History,
    Package,
    PackageSearch,
    RefreshCcw,
    Undo2,
} from 'lucide-react';
import * as assets from '@/routes/employee/assets';
import * as borrows from '@/routes/employee/borrows';
import { useState } from 'react';
import { ReturnRequestDialog } from '@/components/return/return-request-dialog';

// ─── Types ──────────────────────────────────────────────────────────────────

type BorrowStatus = 'pending' | 'borrowed' | 'awaiting_check' | 'returned' | 'rejected';

interface BorrowItem {
    id: number;
    status: BorrowStatus;
    requested_at: string;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: {
            id: number;
            name: string;
        };
    };
}

interface Stats {
    availableAssets: number;
    activeBorrows: number;
    pendingRequests: number;
    totalBorrowed: number;
}

interface Props {
    stats: Stats;
    currentBorrows: BorrowItem[];
    recentActivity: BorrowItem[];
}

// ─── Style maps ─────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: BorrowStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                    {value}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function QuickActionCard({
    icon: Icon,
    title,
    description,
    href,
    onClick,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    href?: string;
    onClick?: () => void;
}) {
    const content = (
        <>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                <Icon className="size-5" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
        </>
    );

    const className =
        'group flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors hover:bg-muted/50';

    if (onClick) {
        return (
            <button onClick={onClick} className={`${className} w-full text-left cursor-pointer`}>
                {content}
            </button>
        );
    }

    return (
        <Link href={href!} className={className}>
            {content}
        </Link>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EmployeeDashboard({
    stats,
    currentBorrows,
    recentActivity,
}: Props) {
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const returnableItems = currentBorrows.filter((b) => b.status === 'borrowed');

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        My Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Browse assets, track your borrows, and manage returns
                    </p>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={Box}
                        label="Available Assets"
                        value={stats.availableAssets}
                    />
                    <StatCard
                        icon={Package}
                        label="Currently Borrowed"
                        value={stats.activeBorrows}
                    />
                    <StatCard
                        icon={Clock}
                        label="Pending Requests"
                        value={stats.pendingRequests}
                    />
                    <StatCard
                        icon={History}
                        label="Total Borrows"
                        value={stats.totalBorrowed}
                    />
                </div>

                {/* ── Quick actions ── */}
                <div>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <QuickActionCard
                            icon={PackageSearch}
                            title="Browse Assets"
                            description="Find and request available equipment"
                            href={assets.index.url()}
                        />
                        <QuickActionCard
                            icon={RefreshCcw}
                            title="My Borrow Requests"
                            description="Track the status of your requests"
                            href={borrows.index.url()}
                        />
                        <QuickActionCard
                            icon={Undo2}
                            title="Process a Return"
                            description="Return an item you've borrowed"
                            onClick={() => setReturnDialogOpen(true)}
                        />
                    </div>
                </div>

                {/* ── Currently borrowed ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="text-sm font-bold text-foreground">
                            Currently Borrowed
                        </h2>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        {currentBorrows.length > 0 ? (
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Asset
                                        </th>
                                        <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Borrowed On
                                        </th>
                                        <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentBorrows.map((borrow) => (
                                        <tr
                                            key={borrow.id}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="py-3.5 pr-4">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {borrow.asset.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {borrow.asset.asset_tag} ·{' '}
                                                    {borrow.asset.category.name}
                                                </p>
                                            </td>
                                            <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                                {new Date(
                                                    borrow.requested_at
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-3.5">
                                                <StatusBadge status={borrow.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center gap-1 py-10 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    Nothing borrowed right now
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Browse available assets to make a request
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Recent activity ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="text-sm font-bold text-foreground">
                            Recent Activity
                        </h2>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        {recentActivity.length > 0 ? (
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Asset
                                        </th>
                                        <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Requested
                                        </th>
                                        <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((activity) => (
                                        <tr
                                            key={activity.id}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="py-3.5 pr-4">
                                                <p className="text-sm font-medium text-foreground">
                                                    {activity.asset.name}
                                                </p>
                                            </td>
                                            <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                                {new Date(
                                                    activity.requested_at
                                                ).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-3.5">
                                                <StatusBadge status={activity.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center gap-1 py-10 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    No activity yet
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Your borrow history will show up here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <ReturnRequestDialog
                    open={returnDialogOpen}
                    items={returnableItems}
                    onOpenChange={setReturnDialogOpen}
                />
            </div>
        </>
    );
}