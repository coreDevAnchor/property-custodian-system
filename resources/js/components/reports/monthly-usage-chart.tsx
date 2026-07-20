interface MonthlyUsagePoint {
    month: string;
    label: string;
    count: number;
}

interface Props {
    data: MonthlyUsagePoint[];
}

export function MonthlyUsageChart({ data }: Props) {
    const maxCount = Math.max(...data.map((point) => point.count), 1);
    const totalBorrows = data.reduce((sum, point) => sum + point.count, 0);

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Monthly Asset Usage
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Approved borrows over the last 12 months
                    </p>
                </div>
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{totalBorrows}</span>{' '}
                    total borrows
                </p>
            </div>

            {totalBorrows === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        No borrow activity in this period yet.
                    </p>
                </div>
            ) : (
                <div className="flex h-52 items-end gap-2 sm:gap-3">
                    {data.map((point) => {
                        const height = Math.max((point.count / maxCount) * 100, point.count > 0 ? 8 : 0);

                        return (
                            <div
                                key={point.month}
                                className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                            >
                                <span className="text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:text-xs">
                                    {point.count}
                                </span>
                                <div className="flex h-40 w-full items-end">
                                    <div
                                        className="w-full rounded-t-md bg-[var(--chart-1)] transition-all group-hover:opacity-90"
                                        style={{ height: `${height}%` }}
                                        title={`${point.label}: ${point.count} borrow${point.count === 1 ? '' : 's'}`}
                                    />
                                </div>
                                <span className="truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
                                    {point.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
