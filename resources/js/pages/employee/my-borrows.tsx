import { Head } from '@inertiajs/react';
import { History, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { rowVariants } from '@/components/assets/asset-table-animations';
import { AnimatedTableBody } from '@/components/ui/animated-table-body';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { borrowStatusLabels, borrowStatusStyles } from '@/types/borrow-status';
import type { BorrowItem, BorrowStatus } from '@/types/borrows';

type SortKey = 'newest' | 'oldest';

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

function BorrowRow({ item }: { item: BorrowItem }) {
    return (
        <motion.tr
            variants={rowVariants}
            className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
        >
            <td className="py-3.5 pr-4">
                <p className="truncate text-sm font-semibold text-foreground">
                    {item.asset.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {item.asset.asset_tag} · {item.asset.category.name}
                </p>
            </td>
            <td className="py-3.5 pr-4">
                <span className="text-sm text-muted-foreground">
                    {new Date(item.requested_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </td>
            <td className="py-3.5 pr-4">
                {item.returned_at ? (
                    <span className="text-sm text-muted-foreground">
                        {new Date(item.returned_at).toLocaleDateString(
                            'en-US',
                            {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            },
                        )}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge status={item.status} />
            </td>
        </motion.tr>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    borrows: {
        data: BorrowItem[];
    };
}

export default function MyBorrows({ borrows }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | BorrowStatus>(
        'All',
    );
    const [sortKey, setSortKey] = useState<SortKey>('newest');

    const filteredBorrows = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        const filtered = (borrows?.data ?? []).filter((item) => {
            const matchesSearch =
                !searchTerm ||
                item.asset.name.toLowerCase().includes(searchTerm) ||
                item.asset.asset_tag.toLowerCase().includes(searchTerm) ||
                item.asset.category.name.toLowerCase().includes(searchTerm);

            const matchesStatus =
                statusFilter === 'All' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return [...filtered].sort((a, b) => {
            const diff =
                new Date(b.requested_at).getTime() -
                new Date(a.requested_at).getTime();

            return sortKey === 'newest' ? diff : -diff;
        });
    }, [borrows, search, statusFilter, sortKey]);

    const animationKey = `${search}-${statusFilter}-${sortKey}`;

    return (
        <>
            <Head title="My Borrow History" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        My Borrow History
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Track the status of everything you've requested or
                        borrowed
                    </p>
                </div>

                {/* ── Filters + table ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by asset name or tag…"
                                className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={statusFilter}
                                onValueChange={(value) =>
                                    setStatusFilter(
                                        value as 'All' | BorrowStatus,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="All">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="borrowed">
                                        Borrowed
                                    </SelectItem>
                                    <SelectItem value="awaiting_check">
                                        Awaiting Check
                                    </SelectItem>
                                    <SelectItem value="returned">
                                        Returned
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        Rejected
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={sortKey}
                                onValueChange={(value) =>
                                    setSortKey(value as SortKey)
                                }
                            >
                                <SelectTrigger className="w-[160px] cursor-pointer">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="newest">
                                        Newest First
                                    </SelectItem>
                                    <SelectItem value="oldest">
                                        Oldest First
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Asset
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Requested
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Returned
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <AnimatedTableBody
                                loading={false}
                                animate
                                animationKey={animationKey}
                            >
                                {filteredBorrows.map((item) => (
                                    <BorrowRow key={item.id} item={item} />
                                ))}
                            </AnimatedTableBody>
                        </table>

                        {filteredBorrows.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <History className="size-8 text-muted-foreground" />
                                <p className="text-sm font-semibold text-foreground">
                                    No borrow history found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border px-6 py-3.5">
                        <p className="text-xs text-muted-foreground">
                            Showing {filteredBorrows.length} of{' '}
                            {borrows?.data?.length ?? 0} requests
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
