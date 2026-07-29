import { CheckCircle2, ClipboardList, PackageCheck, PackageX, Wrench } from 'lucide-react';
import { ReportSummary } from '@/types/reports';

interface Props {
    data: ReportSummary;
}

function StatBlock({
    icon: Icon,
    label,
    value,
    color,
    bg,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
    bg: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`size-4 ${color}`} />
            </div>
            <div>
                <p className={`text-xl font-extrabold leading-none ${color}`}>{value}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function MiniBar({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs font-semibold text-muted-foreground">
                {label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-mono text-muted-foreground">
                {value}
            </span>
        </div>
    );
}

export function ReportSummaryCards({ data }: Props) {
    const returnTotal =
        data.returnConditions.ok + data.returnConditions.defective + data.returnConditions.lost;

    const assetTotal =
        data.assetConditions.excellent +
        data.assetConditions.good +
        data.assetConditions.fair +
        data.assetConditions.poor;

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Borrow &amp; Condition Summary
                </h2>
                <p className="text-sm text-muted-foreground">
                    Lifetime totals across all borrow requests and current inventory condition
                </p>
            </div>

            {/* ── Borrow request totals ── */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatBlock
                    icon={ClipboardList}
                    label="Total Requests"
                    value={data.totalBorrowRequests}
                    color="text-blue-600 dark:text-blue-400"
                    bg="bg-blue-500/10 dark:bg-blue-500/20"
                />
                <StatBlock
                    icon={CheckCircle2}
                    label="Approved"
                    value={data.approvedBorrows}
                    color="text-emerald-600 dark:text-emerald-400"
                    bg="bg-emerald-500/10 dark:bg-emerald-500/20"
                />
                <StatBlock
                    icon={PackageCheck}
                    label="Returned"
                    value={data.returnedBorrows}
                    color="text-purple-600 dark:text-purple-400"
                    bg="bg-purple-500/10 dark:bg-purple-500/20"
                />
            </div>

            <div className="my-6 border-t border-border" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* ── Return condition breakdown ── */}
                <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <PackageCheck className="size-3.5" />
                        Return Condition
                    </h3>
                    <div className="space-y-2.5">
                        <MiniBar
                            label="Good"
                            value={data.returnConditions.ok}
                            total={returnTotal}
                            color="bg-emerald-500"
                        />
                        <MiniBar
                            label="Defective"
                            value={data.returnConditions.defective}
                            total={returnTotal}
                            color="bg-red-500"
                        />
                        <MiniBar
                            label="Lost"
                            value={data.returnConditions.lost}
                            total={returnTotal}
                            color="bg-slate-500"
                        />
                    </div>
                </div>

                {/* ── Asset condition breakdown ── */}
                <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Wrench className="size-3.5" />
                        Inventory Condition
                    </h3>
                    <div className="space-y-2.5">
                        <MiniBar
                            label="Excellent"
                            value={data.assetConditions.excellent}
                            total={assetTotal}
                            color="bg-emerald-500"
                        />
                        <MiniBar
                            label="Good"
                            value={data.assetConditions.good}
                            total={assetTotal}
                            color="bg-blue-500"
                        />
                        <MiniBar
                            label="Fair"
                            value={data.assetConditions.fair}
                            total={assetTotal}
                            color="bg-amber-500"
                        />
                        <MiniBar
                            label="Poor"
                            value={data.assetConditions.poor}
                            total={assetTotal}
                            color="bg-red-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}