import * as Recharts from 'recharts';

import {
    MonthlyUsagePoint,
    UsageMetric,
} from '@/types/reports';

interface Props {
    data: MonthlyUsagePoint[];
    metric: UsageMetric;
    onMetricChange: (metric: UsageMetric) => void;
}

const metricCopy: Record<
    UsageMetric,
    {
        title: string;
        subtitle: string;
        totalLabel: string;
        emptyText: string;
    }
> = {
    borrows: {
        title: 'Monthly Borrow Requests',
        subtitle:
            'Borrow requests over the last 12 months by current outcome',
        totalLabel: 'total requests',
        emptyText:
            'No borrow requests in this period yet.',
    },

    assets_added: {
        title: 'Monthly Assets Added',
        subtitle:
            'Assets added to inventory over the last 12 months by current condition',
        totalLabel: 'total assets',
        emptyText:
            'No assets have been added in this period yet.',
    },
};

const borrowBars = [
    {
        key: 'pending',
        name: 'Pending',
        color: '#f59e0b',
    },
    {
        key: 'returned',
        name: 'Returned',
        color: '#10b981',
    },
    {
        key: 'rejected',
        name: 'Rejected',
        color: '#ef4444',
    },
] as const;

const assetBars = [
    {
        key: 'good',
        name: 'Good',
        color: '#10b981',
    },
    {
        key: 'defective',
        name: 'Defective',
        color: '#f59e0b',
    },
    {
        key: 'lost',
        name: 'Lost',
        color: '#ef4444',
    },
] as const;

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
    }>;
    label?: string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const total = payload.reduce(
        (sum, item) => sum + Number(item.value ?? 0),
        0,
    );

    return (
        <div className="min-w-[180px] rounded-xl border border-border bg-card p-3 shadow-xl">
            <p className="mb-2 text-xs font-bold text-foreground">
                {label}
            </p>

            <div className="space-y-1.5">
                {payload.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between gap-6"
                    >
                        <span className="text-xs text-muted-foreground">
                            {item.name}
                        </span>

                        <span className="text-xs font-bold text-foreground">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            <div className="my-2 border-t border-border" />

            <div className="flex items-center justify-between gap-6">
                <span className="text-xs font-semibold text-muted-foreground">
                    Monthly Total
                </span>

                <span className="text-sm font-extrabold text-foreground">
                    {total}
                </span>
            </div>
        </div>
    );
}

export function MonthlyUsageChart({
    data,
    metric,
    onMetricChange,
}: Props) {
    const copy = metricCopy[metric];

    const bars =
        metric === 'borrows'
            ? borrowBars
            : assetBars;

    const total = data.reduce(
        (sum, point) => sum + point.count,
        0,
    );

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                        {copy.title}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {copy.subtitle}
                    </p>
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    {/* Metric Switch */}
                    <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
                        <button
                            type="button"
                            onClick={() =>
                                onMetricChange('borrows')
                            }
                            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${metric === 'borrows'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Borrows
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onMetricChange(
                                    'assets_added',
                                )
                            }
                            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${metric ===
                                'assets_added'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Assets Added
                        </button>
                    </div>

                    {/* Total */}
                    <div className="whitespace-nowrap text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">
                            {total.toLocaleString()}
                        </span>{' '}
                        {copy.totalLabel}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {bars.map((bar) => (
                    <div
                        key={bar.key}
                        className="flex items-center gap-2"
                    >
                        <span
                            className="size-2.5 rounded-full"
                            style={{
                                backgroundColor:
                                    bar.color,
                            }}
                        />

                        <span className="text-xs font-medium text-muted-foreground">
                            {bar.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {total === 0 ? (
                <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        {copy.emptyText}
                    </p>
                </div>
            ) : (
                <div className="h-[360px] w-full">
                    <Recharts.ResponsiveContainer width="100%" height="100%">
                        <Recharts.BarChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -15,
                                bottom: 5,
                            }}
                            barCategoryGap="25%"
                        >
                            <Recharts.CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                className="stroke-border"
                            />

                            <Recharts.XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                                dy={10}
                            />

                            <Recharts.YAxis
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                tick={{ fontSize: 11 }}
                            />

                            <Recharts.Tooltip
                                cursor={{
                                    fill: 'hsl(var(--muted))',
                                    opacity: 0.25,
                                }}
                                content={<CustomTooltip />}
                            />

                            {bars.map((bar) => (
                                <Recharts.Bar
                                    key={bar.key}
                                    dataKey={bar.key}
                                    name={bar.name}
                                    fill={bar.color}
                                    radius={[5, 5, 0, 0]}
                                    maxBarSize={28}
                                    animationDuration={500}
                                />
                            ))}
                        </Recharts.BarChart>
                    </Recharts.ResponsiveContainer>
                </div>
            )}
        </div>
    );
}