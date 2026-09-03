import { motion } from "framer-motion";
import { rowVariants } from "@/components/assets/asset-table-animations";
import { AnimatedTableBody } from "@/components/ui/animated-table-body";
import { PaginationBar } from "@/components/ui/pagination";
import type { Asset } from "@/types/assets"
import type { Paginated } from "@/types/pagination";

interface Props {
    assets: Paginated<Asset>;
    animationKey: string;
    handlePageChange: (page: number) => void;
    handlePerPageChange: (perPage: number) => void;
}

export function AssetsReportTable({ assets, animationKey, handlePageChange, handlePerPageChange }: Props) {


    return (
        <>

            <div className="overflow-x-auto px-6 pb-2">
                <table className="w-full min-w-[760px]">
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
                            <th className="py-3 pr-4 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Cost
                            </th>
                            <th className="py-3 pr-4 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Rate
                            </th>
                            <th className="py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Total Depreciation
                            </th>
                        </tr>
                    </thead>
                    <AnimatedTableBody
                        loading={false}
                        animate
                        animationKey={animationKey}
                    >
                        {assets.data.map((asset) => (
                            <motion.tr
                                key={asset.id}
                                variants={rowVariants}
                                className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                            >
                                <td className="py-3.5 pr-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {asset.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {asset.asset_tag}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                    <span className="text-sm text-foreground">
                                        {asset.category?.name ??
                                            '—'}
                                    </span>
                                </td>
                                <td className="py-3.5 pr-4">
                                    <span className="text-sm text-muted-foreground">
                                        {asset.asset_type
                                            ?.name ?? '—'}
                                    </span>
                                </td>
                                <td className="py-3.5 pr-4 text-right font-mono text-sm whitespace-nowrap text-foreground">
                                    ₱
                                    {Number(
                                        asset.acquisition_cost,
                                    ).toLocaleString()}
                                </td>
                                <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                                    {asset.depreciation_rate ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            {
                                                asset.depreciation_rate
                                            }
                                            %
                                        </span>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </td>
                                <td className="py-3.5 text-right font-mono text-sm whitespace-nowrap text-foreground">
                                    {asset.total_depreciation
                                        ? `₱${asset.total_depreciation.toLocaleString()}`
                                        : '—'}
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatedTableBody>
                </table>

                {assets?.data.length === 0 && (
                    <div className="flex flex-col items-center gap-1 py-12 text-center">
                        <p className="text-sm font-semibold text-foreground">
                            No assets found
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Try adjusting your filters
                        </p>
                    </div>
                )}
            </div>

            <PaginationBar
                currentPage={assets.current_page}
                lastPage={assets.last_page}
                total={assets.total}
                from={assets.from}
                to={assets.to}
                perPage={assets.per_page}
                itemLabel="assets"
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
            />
        </>
    )
}