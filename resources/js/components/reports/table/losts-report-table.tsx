import { motion } from "framer-motion";
import { PackageX } from "lucide-react";
import { rowVariants } from "@/components/assets/asset-table-animations";
import { AnimatedTableBody } from "@/components/ui/animated-table-body";
import { PaginationBar } from "@/components/ui/pagination";
import type { Paginated } from "@/types/pagination";
import type { LostItem } from "@/types/reports";

interface Props {
    lostItems: Paginated<LostItem>;
    animationKey: string;
    handlePageChange: (page: number) => void;
    handlePerPageChange: (perPage: number) => void;
}

export function LostsReportTable({ lostItems, animationKey, handlePageChange, handlePerPageChange }: Props) {


    return (
        <>
            <div className="overflow-x-auto px-6 pb-2">
                <table className="w-full min-w-[620px]">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Asset
                            </th>
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Category
                            </th>
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Asset Type
                            </th>
                            <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Reported Lost
                            </th>
                            <th className="py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <AnimatedTableBody
                        loading={false}
                        animate
                        animationKey={animationKey}
                    >
                        {(lostItems?.data ?? []).map((item) => (
                            <motion.tr
                                key={item.id}
                                variants={rowVariants}
                                className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                            >
                                <td className="py-3.5 pr-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {item.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {item.asset_tag}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                    {item.category ?? '—'}
                                </td>
                                <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                    {item.asset_type ?? '—'}
                                </td>
                                <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                    {new Date(
                                        item.reported_at,
                                    ).toLocaleDateString(
                                        'en-US',
                                        {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        },
                                    )}
                                </td>
                                <td className="py-3.5">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                                        <PackageX className="size-3" />
                                        Lost
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatedTableBody>
                </table>

                {(lostItems?.data ?? []).length === 0 && (
                    <div className="flex flex-col items-center gap-1 py-12 text-center">
                        <p className="text-sm font-semibold text-foreground">
                            No lost items
                        </p>
                        <p className="text-xs text-muted-foreground">
                            No assets have been reported as
                            lost.
                        </p>
                    </div>
                )}
            </div>

            {lostItems && (
                <PaginationBar
                    currentPage={lostItems.current_page}
                    lastPage={lostItems.last_page}
                    total={lostItems.total}
                    from={lostItems.from}
                    to={lostItems.to}
                    perPage={lostItems.per_page}
                    itemLabel="lost items"
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            )}
        </>
    )
}