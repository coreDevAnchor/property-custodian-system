import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { History } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { dashboard } from '@/routes/custodian';
import { PaginationBar } from '@/components/ui/pagination';
import type { Paginated } from '@/types/pagination';
import type {
    ActivityItem,
    Category,
    DateRange,
    Filters
} from '@/types/activities';



interface Props {
    activity: Paginated<ActivityItem>;
    filters: Filters;
}

const categoryOptions: { value: Category; label: string }[] = [
    { value: 'All', label: 'All Categories' },
    { value: 'assets', label: 'Assets' },
    { value: 'borrow_requests', label: 'Borrow Requests' },
    { value: 'returns', label: 'Returns' },
];

const rangeOptions: { value: DateRange; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
];

export default function AuditTrail({
    activity,
    filters = { category: 'All', range: 'all', per_page: 20 },
}: Props) {
    const [category, setCategory] = useState<Category>(filters.category ?? 'All');
    const [range, setRange] = useState<DateRange>(filters.range ?? 'all');

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        router.get(
            '/custodian/activity',
            {
                category: overrides.category ?? category,
                range: overrides.range ?? range,
                per_page: overrides.per_page ?? activity.per_page,
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['activity', 'filters'] },
        );
    }

    function handleCategoryChange(value: Category) {
        setCategory(value);
        fetchPage(1, { category: value });
    }

    function handleRangeChange(value: DateRange) {
        setRange(value);
        fetchPage(1, { range: value });
    }

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    return (
        <>
            <Head title="Audit Trail" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        Audit Trail
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        A complete, append-only record of everything that's happened
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <History className="size-4 text-muted-foreground" />
                            Activity Log
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={category} onValueChange={(v) => handleCategoryChange(v as Category)}>
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={range} onValueChange={(v) => handleRangeChange(v as DateRange)}>
                                <SelectTrigger className="w-[180px] cursor-pointer">
                                    <SelectValue placeholder="Date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rangeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        <ActivityFeed items={activity.data} />

                        {activity.data.length === 0 && (
                            <div className="flex flex-col items-center gap-1 py-12 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    No activity found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your filters
                                </p>
                            </div>
                        )}
                    </div>

                    <PaginationBar
                        currentPage={activity.current_page}
                        lastPage={activity.last_page}
                        total={activity.total}
                        from={activity.from}
                        to={activity.to}
                        perPage={activity.per_page}
                        itemLabel="events"
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                </div>
            </div>
        </>
    );
}

AuditTrail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Audit Trail', href: '/custodian/activity' },
    ],
};