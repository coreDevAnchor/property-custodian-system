import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Clock,
    Package,
    RotateCcw,
    UserCheck,
} from 'lucide-react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    BorrowerAnalytics,
    MonthlyAnalyticsPoint,
} from '@/types/reports';

interface Props {
    data: BorrowerAnalytics;
}

type MetricKey =
    | 'borrowers'
    | 'returners'
    | 'onTimeReturners'
    | 'defectiveReturns'
    | 'lostItems';

interface MetricConfig {
    key: MetricKey;
    title: string;
    description: string;
    emptyMessage: string;
    icon: typeof Package;
}

const metrics: MetricConfig[] = [
    {
        key: 'borrowers',
        title: 'Top Borrowers',
        description: 'Employees with the most approved borrows',
        emptyMessage: 'No borrow activity for this month.',
        icon: Package,
    },
    {
        key: 'returners',
        title: 'Top Returners',
        description: 'Employees with the most completed returns',
        emptyMessage: 'No completed returns for this month.',
        icon: RotateCcw,
    },
    {
        key: 'onTimeReturners',
        title: 'Best On-Time Returners',
        description: 'Employees with the most on-time returns',
        emptyMessage: 'No on-time returns for this month.',
        icon: Clock,
    },
    {
        key: 'defectiveReturns',
        title: 'Most Defective Returns',
        description: 'Employees with the most damaged item returns',
        emptyMessage: 'No defective returns for this month.',
        icon: AlertTriangle,
    },
    {
        key: 'lostItems',
        title: 'Most Lost Items',
        description: 'Employees associated with the most lost items',
        emptyMessage: 'No lost items for this month.',
        icon: UserCheck,
    },
];

function getMonthLabel(month: string): string {
    const date = new Date(`${month}-01T00:00:00`);

    return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

function getMetricData(
    data: BorrowerAnalytics,
    key: MetricKey,
    month: string,
): MonthlyAnalyticsPoint[] {
    return data[key]
        .filter((item) => item.month === month)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

function MetricChart({
    config,
    data,
    month,
}: {
    config: MetricConfig;
    data: BorrowerAnalytics;
    month: string;
}) {
    const items = getMetricData(data, config.key, month);

    const maxCount = Math.max(
        ...items.map((item) => item.count),
        1,
    );

    const Icon = config.icon;

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                        {config.title}
                    </h3>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {config.description}
                    </p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        {config.emptyMessage}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => {
                        const width = Math.max(
                            (item.count / maxCount) * 100,
                            5,
                        );

                        return (
                            <div key={item.borrower_id}>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">
                                            {index + 1}
                                        </span>

                                        <span className="truncate text-sm font-medium text-foreground">
                                            {item.borrower}
                                        </span>
                                    </div>

                                    <span className="shrink-0 text-xs font-bold text-foreground">
                                        {item.count}
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-[var(--chart-1)] transition-all"
                                        style={{
                                            width: `${width}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function BorrowerAnalyticsChart({
    data,
}: Props) {
    const availableMonths = useMemo(() => {
        const months = new Set<string>();

        const analytics: MonthlyAnalyticsPoint[] = [
            ...data.borrowers,
            ...data.returners,
            ...data.onTimeReturners,
            ...data.defectiveReturns,
            ...data.lostItems,
        ];

        analytics.forEach((item) => {
            months.add(item.month);
        });

        return Array.from(months).sort().reverse();
    }, [data]);

    const [selectedMonth, setSelectedMonth] = useState(
        availableMonths[0] ?? '',
    );

    const currentMonth =
        availableMonths.includes(selectedMonth)
            ? selectedMonth
            : availableMonths[0] ?? '';

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Borrower & Return Analytics
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Compare borrowing, returning, damage, and loss activity
                        by month
                    </p>
                </div>

                <Select
                    value={currentMonth}
                    onValueChange={setSelectedMonth}
                    disabled={availableMonths.length === 0}
                >
                    <SelectTrigger className="w-full sm:w-[190px]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>

                    <SelectContent>
                        {availableMonths.map((month) => (
                            <SelectItem
                                key={month}
                                value={month}
                            >
                                {getMonthLabel(month)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {availableMonths.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        No borrower activity is available for the selected
                        reporting period.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {metrics.map((metric) => (
                        <MetricChart
                            key={metric.key}
                            config={metric}
                            data={data}
                            month={currentMonth}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}