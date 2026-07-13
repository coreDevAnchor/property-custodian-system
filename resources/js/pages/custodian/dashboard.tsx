import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    Box,
    CheckCircle,
    Clock,
    Plus,
    UserPlus,
} from 'lucide-react';
import { dashboard } from '@/routes/custodian';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Stats {
    totalAssets: number;
    availableAssets: number;
    borrowedOut: number;
    pendingRequests: number;
    awaitingReturns: number;
}

interface PendingRequest {
    id: number;
    requested_at: string;
    remarks?: string | null;

    asset: {
        id: number;
        name: string;
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
}

interface CategoryBreakdown {
    label: string;
    count: number;
}

interface Props {
    stats: Stats;
    pendingRequests: PendingRequest[];
    assetCategories: {
        total: number;
        breakdown: CategoryBreakdown[];
    };
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const categoryColors = [
    'bg-[#0d7a5f]',
    'bg-orange-500',
    'bg-sky-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

const avatarColors = [
    'bg-violet-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-rose-500',
    'bg-amber-500',
];

function avatarColorFor(id: number) {
    return avatarColors[id % avatarColors.length];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}) {
    return (
        <div
            className="
                flex flex-col gap-3 rounded-xl
                border border-gray-100 dark:border-zinc-800
                bg-white dark:bg-zinc-900
                p-5
                shadow-xs
                transition-shadow
                hover:shadow-sm
                "
        >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor}`}>
                <Icon className={`size-5 ${color}`} />
            </div>
            <div>
                <p className={`text-2xl font-extrabold tracking-tight ${color}`}>
                    {value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </p>
            </div>
        </div>
    );
}

function RequestRow({
    request,
    onApprove,
    onReject,
}: {
    request: PendingRequest;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}) {
    return (
        <tr className="
                group
                border-b border-gray-50 dark:border-zinc-800
                transition-colors
                last:border-0
                hover:bg-gray-50 dark:hover:bg-zinc-800/40
                ">
            {/* Employee */}
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${avatarColorFor(
                            request.employee.id
                        )} text-xs font-bold text-white`}
                    >
                        {getInitials(request.employee.user.name)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                            {request.employee.user.name}
                        </p>
                        {request.remarks && (
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {request.remarks}
                            </p>
                        )}
                    </div>
                </div>
            </td>
            {/* Asset */}
            <td className="py-3.5 pr-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {request.asset.name}
                </span>
            </td>
            {/* Category */}
            <td className="py-3.5 pr-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {request.asset.category.name}
                </span>
            </td>
            {/* Requested */}
            <td className="py-3.5 pr-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(request.requested_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </td>
            {/* Actions */}
            <td className="py-3.5">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onApprove(request.id)}
                        className="rounded-lg bg-[#0d7a5f] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0a6550] active:scale-95 cursor-pointer"
                        aria-label={`Approve request from ${request.employee.user.name}`}
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => onReject(request.id)}
                        className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 active:scale-95 cursor-pointer"
                        aria-label={`Reject request from ${request.employee.user.name}`}
                    >
                        Reject
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Dashboard({ stats, pendingRequests, assetCategories }: Props) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const statCards = [
        {
            label: 'Total Assets',
            value: stats.totalAssets,
            icon: Box,
            color: 'text-slate-400',
            bgColor: 'bg-slate-50',
        },
        {
            label: 'Available',
            value: stats.availableAssets,
            icon: CheckCircle,
            color: 'text-[#0d7a5f]',
            bgColor: 'bg-emerald-50',
        },
        {
            label: 'Borrowed Out',
            value: stats.borrowedOut,
            icon: Box,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Pending Requests',
            value: stats.pendingRequests,
            icon: Clock,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50',
        },
        {
            label: 'Awaiting Returns',
            value: stats.awaitingReturns,
            icon: AlertCircle,
            color: 'text-orange-500',
            bgColor: 'bg-orange-50',
        },
    ];

    function handleApprove(id: number) {
        router.put(
            `/custodian/borrow-requests/${id}`,
            { status: 'borrowed' },
            { preserveScroll: true }
        );
    }

    function handleReject(id: number) {
        router.put(
            `/custodian/borrow-requests/${id}`,
            { status: 'rejected' },
            { preserveScroll: true }
        );
    }

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    {statCards.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                {/* ── Main content grid ── */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Pending Borrow Requests table — takes 2/3 width */}
                    <div className="xl:col-span-2">
                        <div className="
                                rounded-xl
                                border border-gray-100 dark:border-zinc-800
                                bg-white dark:bg-zinc-900
                                shadow-xs
                            ">
                            {/* Card header */}
                            <div className="flex items-start justify-between border-b border-gray-100 dark:border-zinc-800 px-6 py-4">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                        Pending Borrow Requests
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        Review and approve employee asset requests
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.visit('/custodian/borrow-requests')}
                                    className="flex items-center gap-1 text-xs font-semibold text-[#0d7a5f] hover:underline cursor-pointer"
                                >
                                    View all
                                    <ArrowRight className="size-3" />
                                </button>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto px-6 pb-4">
                                {pendingRequests.length > 0 ? (
                                    <table className="w-full min-w-[640px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-zinc-800">
                                                <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Employee
                                                </th>
                                                <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Asset
                                                </th>
                                                <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Category
                                                </th>
                                                <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Requested
                                                </th>
                                                <th className="py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingRequests.map((req) => (
                                                <RequestRow
                                                    key={req.id}
                                                    request={req}
                                                    onApprove={handleApprove}
                                                    onReject={handleReject}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 py-10 text-center">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                            No pending requests
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            New borrow requests will appear here
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right column: Quick Actions + Asset Categories */}
                    <div className="flex flex-col gap-6">
                        {/* Quick Actions */}
                        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                            <div className="border-b border-gray-100 dark:border-zinc-800 px-6 py-4">
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="flex flex-col gap-3 p-6">
                                <button
                                    onClick={() => router.visit('/custodian/assets')}
                                    className="cursor-pointer flex h-11 w-full items-center gap-3 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98]"
                                >
                                    <Plus className="size-4 shrink-0" />
                                    Add New Asset
                                </button>

                                <button
                                    onClick={() => router.visit('/custodian/employees')}
                                    className="cursor-pointer flex p-2 h-11 w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-all hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98]"
                                >
                                    <UserPlus className="size-4 shrink-0 text-gray-500" />
                                    Add Employee
                                </button>

                                <button
                                    onClick={() => router.visit('/custodian/activity')}
                                    className="cursor-pointer flex p-2 h-11 w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-all hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98]"
                                >
                                    <BarChart3 className="size-4 shrink-0 text-gray-500" />
                                    View Audit Trail
                                </button>
                            </div>
                        </div>

                        {/* Asset Categories */}
                        <div className="
                                rounded-xl
                                border border-gray-100 dark:border-zinc-800
                                bg-white dark:bg-zinc-900
                                shadow-xs
                            ">
                            <div className="border-b border-gray-100 dark:border-zinc-800 px-6 py-4">
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                    Asset Categories
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4 p-6">
                                {assetCategories.breakdown.length > 0 ? (
                                    assetCategories.breakdown.map((cat, index) => (
                                        <div key={cat.label} className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {cat.label}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {cat.count}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                                                <div
                                                    className={`h-full rounded-full ${categoryColors[index % categoryColors.length]
                                                        } transition-all duration-500`}
                                                    style={{
                                                        width: `${assetCategories.total > 0
                                                            ? Math.round(
                                                                (cat.count / assetCategories.total) * 100
                                                            )
                                                            : 0
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No categories yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};