import { TrendingDown } from 'lucide-react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    DepreciationGranularity,
    DepreciationPoint,
} from '@/types/reports';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

const granularityOptions: Array<{
    value: DepreciationGranularity;
    label: string;
}> = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
];

function DepreciationLineTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                {currencyFormatter.format(payload[0].value)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Total depreciation
            </p>
        </div>
    );
}

export function DepreciationOverTimeCard({
    series,
    granularity,
    onGranularityChange,
}: {
    series: DepreciationPoint[];
    granularity: DepreciationGranularity;
    onGranularityChange: (granularity: DepreciationGranularity) => void;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                        <TrendingDown className="size-4 text-primary" />
                        Total Depreciation Over Time
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Annual depreciation by acquisition date
                    </p>
                </div>

                <Select
                    value={granularity}
                    onValueChange={(value) =>
                        onGranularityChange(
                            value as DepreciationGranularity,
                        )
                    }
                >
                    <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {granularityOptions.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="p-6">
                {series.length === 0 ? (
                    <div className="flex h-[260px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 text-center dark:border-zinc-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            No depreciation data
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Assets with depreciation will appear here
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={series}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 0,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="4 4"
                                        opacity={0.35}
                                    />

                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: '#71717a',
                                        }}
                                        dy={8}
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                        tick={{
                                            fontSize: 11,
                                            fill: '#71717a',
                                        }}
                                        tickFormatter={(value: number) =>
                                            `₱${compactMoneyFormatter.format(value)}`
                                        }
                                    />

                                    <Tooltip
                                        cursor={{
                                            stroke: '#71717a',
                                            strokeWidth: 1,
                                            strokeDasharray: '4 4',
                                        }}
                                        content={
                                            <DepreciationLineTooltip />
                                        }
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#f97316"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#f97316' }}
                                        activeDot={{ r: 5 }}
                                        animationDuration={500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/50">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Total depreciation
                            </span>
                            <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                                {currencyFormatter.format(
                                    series.reduce(
                                        (sum, point) => sum + point.value,
                                        0,
                                    ),
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const compactMoneyFormatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
});