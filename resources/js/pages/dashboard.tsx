import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Box,
    CheckCircle,
    Clock,
    Plus,
    Search,
    UserPlus,
} from 'lucide-react';
import { dashboard } from '@/routes/custodian';

// ─── Static mock data (replaced with real props once API is ready) ────────────

const stats = [
    {
        id: 'total-assets',
        label: 'Total Assets',
        value: 482,
        icon: Box,
        color: 'text-slate-400',
        bgColor: 'bg-slate-50',
    },
    {
        id: 'available',
        label: 'Available',
        value: 316,
        icon: CheckCircle,
        color: 'text-primary',
        bgColor: 'bg-orange-50',
    },
    {
        id: 'borrowed-out',
        label: 'Borrowed Out',
        value: 149,
        icon: Box,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
    },
    {
        id: 'pending-requests',
        label: 'Pending Requests',
        value: 12,
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
    },
    {
        id: 'overdue-returns',
        label: 'Overdue Returns',
        value: 4,
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
    },
];

const pendingRequests = [
    {
        id: 1,
        employee: 'Maria Reyes',
        department: 'Marketing',
        initials: 'MR',
        color: 'bg-violet-500',
        asset: 'MacBook Pro 14"',
        requested: 'Jul 6, 2026',
        duration: '5 days',
    },
    {
        id: 2,
        employee: 'Angelo Torres',
        department: 'Field Operations',
        initials: 'AT',
        color: 'bg-teal-500',
        asset: 'Toyota Hilux (Van 2)',
        requested: 'Jul 6, 2026',
        duration: '2 days',
    },
    {
        id: 3,
        employee: 'Kim Santos',
        department: 'IT Department',
        initials: 'KS',
        color: 'bg-sky-500',
        asset: 'Projector — Epson EB-X06',
        requested: 'Jul 5, 2026',
        duration: '1 day',
    },
    {
        id: 4,
        employee: 'Liza Padilla',
        department: 'Finance',
        initials: 'LP',
        color: 'bg-rose-500',
        asset: 'Calculator (Scientific) ×3',
        requested: 'Jul 5, 2026',
        duration: '10 days',
    },
];

const assetCategories = [
    { label: 'IT Equipment', count: 186, max: 482, color: 'bg-primary' },
    { label: 'Vehicles', count: 24, max: 482, color: 'bg-orange-500' },
    { label: 'Office Furniture', count: 140, max: 482, color: 'bg-sky-500' },
    { label: 'Lab Equipment', count: 67, max: 482, color: 'bg-violet-500' },
    { label: 'Audio/Visual', count: 65, max: 482, color: 'bg-amber-500' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
    id,
    label,
    value,
    icon: Icon,
    color,
    bgColor,
}: (typeof stats)[0]) {
    return (
        <div
            id={id}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
        >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor}`}>
                <Icon className={`size-5 ${color}`} />
            </div>
            <div>
                <p className={`text-2xl font-extrabold tracking-tight ${color}`}>
                    {value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function RequestRow({
    employee,
    department,
    initials,
    color,
    asset,
    requested,
    duration,
}: (typeof pendingRequests)[0]) {
    return (
        <tr className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
            {/* Employee */}
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}
                    >
                        {initials}
                    </div>
                    <div className="min-w-0 max-w-[220px]">
                        <p className="truncate text-sm font-semibold text-gray-800">
                            {employee}
                        </p>
                        <p
                            className="truncate text-xs text-gray-400"
                            title={department}
                        >
                            {department}
                        </p>
                    </div>
                </div>
            </td>
            {/* Asset */}
            <td className="py-3.5 pr-4">
                <span className="text-sm text-gray-700">{asset}</span>
            </td>
            {/* Requested */}
            <td className="py-3.5 pr-4">
                <span className="text-sm text-gray-500">{requested}</span>
            </td>
            {/* Duration */}
            <td className="py-3.5 pr-4">
                <span className="text-sm text-gray-500">{duration}</span>
            </td>
            {/* Actions */}
            <td className="py-3.5">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                        className="shrink-0 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
                        aria-label={`Approve request from ${employee}`}
                    >
                        Approve
                    </button>
                    <button
                        className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 active:scale-95"
                        aria-label={`Reject request from ${employee}`}
                    >
                        Reject
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                            Dashboard
                        </h1>
                        <p className="text-sm text-gray-400">{today}</p>
                    </div>

                    {/* Search bar */}
                    <div className="relative mt-3 w-full max-w-xs sm:mt-0">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <input
                            id="dashboard-search"
                            type="text"
                            placeholder="Search assets, employees, requests…"
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    {stats.map((stat) => (
                        <StatCard key={stat.id} {...stat} />
                    ))}
                </div>

                {/* ── Main content grid ── */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Pending Borrow Requests table — takes 2/3 width */}
                    <div className="xl:col-span-2">
                        <div className="rounded-xl border border-gray-100 bg-white shadow-xs">
                            {/* Card header */}
                            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Pending Borrow Requests
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        Review and approve employee asset requests
                                    </p>
                                </div>
                                <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                    View all
                                    <ArrowRight className="size-3" />
                                </button>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto px-6 pb-4">
                                <table className="w-full min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Employee
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Asset
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Requested
                                            </th>
                                            <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Duration
                                            </th>
                                            <th className="w-[170px] py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.map((req) => (
                                            <RequestRow key={req.id} {...req} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right column: Quick Actions + Asset Categories */}
                    <div className="flex flex-col gap-6">
                        {/* Quick Actions */}
                        <div className="rounded-xl border border-gray-100 bg-white shadow-xs">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h2 className="text-base font-bold text-gray-900">
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="flex flex-col gap-3 p-6">
                                {/* Primary CTA */}
                                <button
                                    id="add-new-asset-btn"
                                    className="flex h-11 w-full items-center gap-3 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98]"
                                >
                                    <Plus className="size-4 shrink-0" />
                                    Add New Asset
                                </button>

                                {/* Secondary CTAs */}
                                <button
                                    id="add-employee-btn"
                                    className="flex h-11 w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                                >
                                    <UserPlus className="size-4 shrink-0 text-gray-500" />
                                    Add Employee
                                </button>

                                <button
                                    id="generate-report-btn"
                                    className="flex h-11 w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                                >
                                    <BarChart3 className="size-4 shrink-0 text-gray-500" />
                                    Generate Report
                                </button>
                            </div>
                        </div>

                        {/* Asset Categories */}
                        <div className="rounded-xl border border-gray-100 bg-white shadow-xs">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h2 className="text-base font-bold text-gray-900">
                                    Asset Categories
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4 p-6">
                                {assetCategories.map((cat) => (
                                    <div key={cat.label} className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">
                                                {cat.label}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {cat.count}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                                                style={{
                                                    width: `${Math.round((cat.count / cat.max) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
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
