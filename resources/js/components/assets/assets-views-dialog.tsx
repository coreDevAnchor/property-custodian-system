import { Pencil } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';
import { ActivityFeed } from '@/components/activity/activity-feed';
import {
    AssetDetailPanel,
    StatusBadge,
} from '@/components/assets/asset-detail-panel';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PaginationBar } from '@/components/ui/pagination';
import type { ActivityItem } from '@/types/activities';
import type { Asset } from '@/types/assets';
import type { Paginated } from '@/types/pagination';

type ViewableAsset = Asset;

interface Props {
    open: boolean;
    asset?: ViewableAsset;
    onOpenChange: (open: boolean) => void;
    onEdit?: (asset: ViewableAsset) => void;
    readOnly?: boolean;
}

const ACTIVITY_PER_PAGE = 5;

export function AssetViewDialog({
    open,
    asset,
    onOpenChange,
    onEdit,
    readOnly = false,
}: Props) {
    // Hooks must run unconditionally on every render — moved above the
    // early return below (previously this threw "Rendered fewer hooks
    // than expected" whenever `asset` was undefined on a given render).
    const [fullAsset, setFullAsset] = useState<ViewableAsset | null>(null);
    const [activity, setActivity] = useState<Paginated<ActivityItem> | null>(
        null,
    );
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!open || !asset || readOnly) {
            return;
        }

        let cancelled = false;

        fetch(
            `/custodian/assets/${asset.id}?page=${page}&per_page=${ACTIVITY_PER_PAGE}`,
            {
                headers: { Accept: 'application/json' },
            },
        )
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) {
                    return;
                }

                const { activity_logs, ...assetData } = data;
                setFullAsset(assetData as ViewableAsset);
                setActivity(activity_logs ?? null);
            })
            .catch(() => {
                // Keep showing row-prop data if the refresh fails.
            });

        return () => {
            cancelled = true;
        };
    }, [open, asset, readOnly, page]);

    const handleActivityPageChange = useCallback((nextPage: number) => {
        setPage(nextPage);
    }, []);

    const display = fullAsset ?? asset;

    if (!display) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4 pr-8">
                        <div>
                            <DialogTitle>{display.name}</DialogTitle>

                            <DialogDescription>
                                {display.asset_tag}
                            </DialogDescription>
                        </div>
                        <StatusBadge status={display.status} />
                    </div>
                </DialogHeader>

                <AssetDetailPanel asset={display} readOnly={readOnly} />

                {!readOnly && (
                    <div>
                        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                            Activity Timeline
                        </span>
                        <div className="mt-2 rounded-lg border border-border p-3">
                            <ActivityFeed items={activity?.data ?? []} />

                            {activity && activity.total > 0 && (
                                <div className="-mx-6 mt-2 -mb-3.5 border-t border-border">
                                    <PaginationBar
                                        currentPage={activity.current_page}
                                        lastPage={activity.last_page}
                                        total={activity.total}
                                        from={activity.from}
                                        to={activity.to}
                                        perPage={ACTIVITY_PER_PAGE}
                                        itemLabel="activities"
                                        onPageChange={handleActivityPageChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>

                    {onEdit && !readOnly && (
                        <Button
                            className="cursor-pointer"
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(display);
                            }}
                        >
                            <Pencil className="size-4" />
                            Edit Asset
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}