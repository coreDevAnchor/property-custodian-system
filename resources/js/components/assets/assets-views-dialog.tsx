import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageOff, Pencil } from "lucide-react";

import type { Asset, AssetStatus } from "@/types/assets";
import { useEffect, useState } from 'react';
import { ActivityFeed } from '@/components/activity/activity-feed';

type ViewableAsset = Asset;

const statusLabels: Record<AssetStatus, string> = {
    available: 'Available',
    borrowed: 'Borrowed',
    under_repair: 'Under Repair',
    disposed: 'Disposed',
    lost: 'Lost',
};

const statusStyles: Record<AssetStatus, string> = {
    available:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    borrowed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    under_repair:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    disposed: "bg-muted text-muted-foreground",
    lost:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function StatusBadge({ status }: { status: AssetStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

const conditionLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Excellent',
};

const conditionStyles: Record<number, string> = {
    1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    3: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function ConditionBadge({ condition }: { condition?: number | null }) {
    if (!condition || !conditionLabels[condition]) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${conditionStyles[condition]}`}
        >
            {conditionLabels[condition]}
        </span>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span className="text-sm font-medium text-foreground">
                {value ?? <span className="text-muted-foreground">—</span>}
            </span>
        </div>
    );
}

interface Props {
    open: boolean;
    asset?: ViewableAsset;
    onOpenChange: (open: boolean) => void;
    onEdit?: (asset: ViewableAsset) => void;
    readOnly?: boolean;
}

function formatCurrency(value?: number | string | null) {
    if (value === undefined || value === null || value === "") return undefined;
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return undefined;
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(num);
}

function formatDate(value?: string | null) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function AssetViewDialog({ open, asset, onOpenChange, onEdit, readOnly = false }: Props) {
    // Hooks must run unconditionally on every render — moved above the
    // early return below (previously this threw "Rendered fewer hooks
    // than expected" whenever `asset` was undefined on a given render).
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!open || !asset || readOnly) return;

        fetch(`/custodian/assets/${asset.id}`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => setLogs(data.activity_logs ?? []));
    }, [open, asset?.id, readOnly]);

    if (!asset) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4 pr-8">
                        <div>
                            <DialogTitle>{asset.name}</DialogTitle>
                            <DialogDescription>
                                {asset.asset_tag}
                            </DialogDescription>
                        </div>
                        <StatusBadge status={asset.status} />
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* ── Left: photo (1/3) ── */}
                    <div className="lg:col-span-1">
                        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                            {asset.photo ? (
                                <img
                                    src={`/storage/${asset.photo}`}
                                    alt={asset.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <ImageOff className="size-8" />
                                    <span className="text-xs font-medium">
                                        No photo uploaded
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: details (2/3) ── */}
                    <div className="space-y-6 lg:col-span-2">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Description
                            </span>
                            <p className="mt-1 text-sm text-foreground">
                                {asset.description || (
                                    <span className="text-muted-foreground">
                                        No description provided.
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <DetailRow label="Category" value={asset.category?.name} />
                            <DetailRow
                                label="Asset Type"
                                value={asset.asset_type?.name}
                            />
                            <DetailRow label="Location" value={asset.location?.name} />
                            {!readOnly && (
                                <DetailRow
                                    label="Serial Number"
                                    value={asset.serial_number}
                                />
                            )}
                            <DetailRow
                                label="Acquisition Date"
                                value={formatDate(asset.acquisition_date)}
                            />
                            {!readOnly && (
                                <DetailRow
                                    label="Acquisition Cost"
                                    value={formatCurrency(asset.acquisition_cost)}
                                />
                            )}
                            {!readOnly && (
                                <DetailRow
                                    label="Depreciation Rate"
                                    value={
                                        asset.depreciation_rate !== undefined
                                            ? `${asset.depreciation_rate}%`
                                            : undefined
                                    }
                                />
                            )}
                            <DetailRow
                                label="Condition"
                                value={<ConditionBadge condition={asset.condition} />}
                            />
                            {asset.category?.name === 'Office Supplies' && (
                                <DetailRow
                                    label="Amount"
                                    value={`${asset.amount ?? 1} units`}
                                />
                            )}
                        </div>

                        {asset.remarks && !readOnly && (
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Remarks
                                </span>
                                <p className="mt-1 text-sm text-foreground">
                                    {asset.remarks}
                                </p>
                            </div>
                        )}

                        {/* ── Current Status ── */}
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Current Status
                            </span>

                            <div className="mt-2 rounded-lg border border-border p-3">
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={asset.status} />
                                    <span className="text-sm text-muted-foreground">
                                        {asset.status === 'available' && 'This asset is currently available.'}
                                        {asset.status === 'borrowed' && 'This asset is currently borrowed.'}
                                        {asset.status === 'under_repair' && 'This asset is currently under repair.'}
                                        {asset.status === 'disposed' && 'This asset has been disposed.'}
                                        {asset.status === 'lost' && 'This asset has been reported as lost.'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!readOnly && (
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Activity Timeline
                                </span>
                                <div className="mt-2 rounded-lg border border-border p-3">
                                    <ActivityFeed items={logs} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>

                    {onEdit && !readOnly && (
                        <Button
                            className="cursor-pointer"
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(asset);
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