import { PieChart } from 'lucide-react';
import {
    Cell,
    Legend,
    Pie,
    PieChart as PieChartComponent,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import type { DepartmentStat } from '@/types/reports';

const chartColors = [
    '#f97316',
    '#f59e0b',
    '#0ea5e9',
    '#8b5cf6',
    '#ef4444',
    '#10b981',
    '#ec4899',
    '#6366f1',
];

function DeparturePieTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: DepartmentStat }>;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0].payload;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
                {item.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.count.toLocaleString()}{' '}
                {item.count === 1 ? 'asset' : 'assets'} borrowed
            </p>
        </div>
    );
}

export function AssetsByDepartmentCard({
    breakdown,
    total,
}: {
    breakdown: DepartmentStat[];
    total: number;
}) {
    const data = breakdown.filter((item) => item.count > 0);

    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
                <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                        <PieChart className="size-4 text-primary" />
                        Assets by Department
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Currently borrowed assets by department
                    </p>
                </div>
            </div>

            <div className="p-6">
                {data.length === 0 ? (
                    <div className="flex h-[260px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 text-center dark:border-zinc-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            No borrowed assets
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Assets out on loan will appear here
                        </p>
                    </div>
                ) : (
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChartComponent>
                                <Pie
                                    data={data}
                                    dataKey="count"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    strokeWidth={2}
                                    animationDuration={500}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={entry.label}
                                            fill={
                                                chartColors[
                                                    index % chartColors.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<DeparturePieTooltip />}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => (
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChartComponent>
                        </ResponsiveContainer>
                    </div>
                )}

                {data.length > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/50">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Total borrowed
                        </span>
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                            {total.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}