import { Paginated } from "@/types/pagination";
import { PaginationBar } from "@/components/ui/pagination";
import { OverdueItem } from "@/types/reports";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import borrowRequests from "@/routes/custodian/borrow-requests";
import { motion } from "framer-motion";
import { rowVariants } from "@/components/assets/asset-table-animations";
import { AnimatedTableBody } from "@/components/ui/animated-table-body";

function OverdueBadge({ days }: { days: number }) {
    const cls =
        days >= 14
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : days >= 7
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
        >
            <AlertTriangle className="size-3" />
            {days}d overdue
        </span>
    );
}

interface Props {
    overdueItems: Paginated<OverdueItem>;
    animationKey: string;
    handlePageChange: (page: number) => void;
    handlePerPageChange: (perPage: number) => void;
}

export function OverdueReportTable({ overdueItems, animationKey, handlePageChange, handlePerPageChange }: Props) {


    return (
        <>
            <div className="overflow-x-auto px-6 pb-2">
                <table className="w-full min-w-[680px]">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Borrower
                            </th>
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Asset
                            </th>
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Category
                            </th>
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Expected Return
                            </th>
                            <th className="py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Status
                            </th>
                            <th className="py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <AnimatedTableBody
                        loading={false}
                        animate
                        animationKey={animationKey}
                    >
                        {(overdueItems?.data ?? []).map(
                            (item) => (
                                <motion.tr
                                    key={item.id}
                                    variants={rowVariants}
                                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                                >
                                    <td className="py-3.5 pr-4">
                                        <span className="text-sm font-semibold text-foreground">
                                            {item.borrower ??
                                                '—'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 pr-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-foreground">
                                                {item.asset_name ??
                                                    '—'}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {item.asset_tag}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="py-3.5 pr-4">
                                        <span className="text-sm text-muted-foreground">
                                            {item.category ??
                                                '—'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 pr-4">
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(
                                                item.expected_return_date,
                                            ).toLocaleDateString(
                                                'en-US',
                                                {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                },
                                            )}
                                        </span>
                                    </td>
                                    <td className="py-3.5">
                                        <OverdueBadge
                                            days={
                                                item.days_overdue
                                            }
                                        />
                                    </td>

                                    <td className="py-3.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                router.post(
                                                    borrowRequests.remind(item.id),
                                                    {},
                                                    {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                    }
                                                );
                                            }}
                                        >
                                            Remind
                                        </Button>
                                    </td>
                                </motion.tr>
                            ),
                        )}
                    </AnimatedTableBody>
                </table>

                {(overdueItems?.data ?? []).length === 0 && (
                    <div className="flex flex-col items-center gap-1 py-12 text-center">
                        <p className="text-sm font-semibold text-foreground">
                            No overdue items
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Everything currently borrowed is
                            within its return window.
                        </p>
                    </div>
                )}
            </div>

            {overdueItems && (
                <PaginationBar
                    currentPage={overdueItems.current_page}
                    lastPage={overdueItems.last_page}
                    total={overdueItems.total}
                    from={overdueItems.from}
                    to={overdueItems.to}
                    perPage={overdueItems.per_page}
                    itemLabel="overdue items"
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            )}
        </>
    )
}