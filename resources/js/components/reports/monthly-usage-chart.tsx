import { useState } from 'react';
import * as Recharts from 'recharts';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    MonthlyUsagePoint,
    UsageMetric,
} from '@/types/reports';

import type { ReportPeriod } from '@/types/reports';

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
        subtitle: 'Assets added by current condition',
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
        color: string;
        fill: string;
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
                        <div className="flex items-center gap-2">

                            <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                    backgroundColor: item.color,
                                }}
                            />

                            <span className="text-xs text-muted-foreground">
                                {item.name}
                            </span>

                        </div>

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


interface Props {
    data: MonthlyUsagePoint[];
    metric: UsageMetric;
    period: ReportPeriod;
    onMetricChange: (metric: UsageMetric) => void;
    onPeriodChange: (period: ReportPeriod) => void;
}

export function MonthlyUsageChart({
    data,
    metric,
    period,
    onMetricChange,
    onPeriodChange,
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
        <Card className="rounded-2xl shadow-sm">
            {/* Header */}
            <CardHeader className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <CardTitle className="text-xl font-semibold">
                        {metric === 'assets_added'
                            ? period === 'today'
                                ? 'Assets Added Today'
                                : period === 'week'
                                    ? 'Assets Added This Week'
                                    : period === 'month'
                                        ? 'Assets Added This Month'
                                        : 'Assets Added This Year'
                            : period === 'today'
                                ? 'Borrow Requests Today'
                                : period === 'week'
                                    ? 'Borrow Requests This Week'
                                    : period === 'month'
                                        ? 'Borrow Requests This Month'
                                        : 'Borrow Requests This Year'}
                    </CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {copy.subtitle}
                    </p>
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    {/* Metric Switch */}
                    <div className="flex items-center p-1 gap-2">
                        <Select
                            value={metric}
                            onValueChange={(value) =>
                                onMetricChange(value as UsageMetric)
                            }
                        >

                            <SelectTrigger className="w-48">

                                <SelectValue />

                            </SelectTrigger>

                            <SelectContent>

                                <SelectItem value="borrows">

                                    Borrow Requests

                                </SelectItem>

                                <SelectItem value="assets_added">

                                    Assets Added

                                </SelectItem>

                            </SelectContent>

                        </Select>

                        <Select
                            value={period}
                            onValueChange={(value) =>
                                onPeriodChange(value as ReportPeriod)
                            }
                        >

                            <SelectTrigger className="w-36">

                                <SelectValue />

                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="today">
                                    Today
                                </SelectItem>

                                <SelectItem value="week">
                                    This Week
                                </SelectItem>

                                <SelectItem value="month">
                                    This Month
                                </SelectItem>

                                <SelectItem value="year">
                                    This Year
                                </SelectItem>
                            </SelectContent>

                        </Select>
                    </div>


                </div>
            </CardHeader>


            <CardContent className="border-t pt-5">
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
                    <div className="flex h-[450px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                            {copy.emptyText}
                        </p>
                    </div>
                ) : (
                    <div className="h-[450px] w-full rounded-xl bg-muted/20 p-4">
                        <Recharts.ResponsiveContainer width="100%" height="100%">
                            <Recharts.BarChart
                                data={data}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -5,
                                    bottom: 5,
                                }}
                                barCategoryGap="25%"
                            >
                                <Recharts.CartesianGrid
                                    vertical={false}
                                    strokeDasharray="4 4"
                                    opacity={0.35}
                                />

                                <Recharts.XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fontSize: 12,
                                        fill: "#71717a"
                                    }}
                                    dy={10}
                                />

                                <Recharts.YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                    tick={{
                                        fontSize: 12,
                                        fill: "#71717a"
                                    }}
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
                                        radius={[10, 10, 0, 0]}
                                        maxBarSize={42}
                                        animationDuration={500}
                                    />
                                ))}
                            </Recharts.BarChart>
                        </Recharts.ResponsiveContainer>

                    </div>
                )}
            </CardContent>

            <CardContent className="border-t mt-[5px]">

                {/* Total */}
                <div className="whitespace-nowrap text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">
                        {total.toLocaleString()}
                    </span>{' '}
                    {copy.totalLabel}
                </div>

            </CardContent>
        </Card>
    );
}