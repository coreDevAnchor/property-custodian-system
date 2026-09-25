import { ImageOff, QrCode } from 'lucide-react';

import { qr } from '@/routes/assets';
import type { Asset, AssetStatus } from '@/types/assets';

const statusLabels: Record<AssetStatus, string> = {
    available: 'Available',
    borrowed: 'Borrowed',
    under_repair: 'Under Repair',
    disposed: 'Pull out',
    lost: 'Lost',
};

const statusStyles: Record<AssetStatus, string> = {
    available:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    borrowed:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    under_repair:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    disposed: 'bg-muted text-muted-foreground',
    lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function StatusBadge({ status }: { status: AssetStatus }) {
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
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-sm font-medium text-foreground">
                {value ?? <span className="text-muted-foreground">—</span>}
            </span>
        </div>
    );
}

function formatCurrency(value?: number | string | null) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (Number.isNaN(num)) {
        return undefined;
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(num);
}

function formatDate(value?: string | null) {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function AssetDetailPanel({
    asset,
    readOnly = false,
}: {
    asset: Asset;
    readOnly?: boolean;
}) {
    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
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

                <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
                    <img
                        src={qr.url({ asset: asset.id })}
                        alt={`QR code for ${asset.name}`}
                        className="size-36"
                    />
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        <QrCode className="size-3.5" />
                        Scan to view asset
                    </span>
                </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
                <div>
                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
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
                    {asset.category?.unit_type === 'multi' && (
                        <DetailRow
                            label="Quantity"
                            value={asset.amount ?? 1}
                        />
                    )}
                </div>

                {asset.remarks && !readOnly && (
                    <div>
                        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                            Remarks
                        </span>
                        <p className="mt-1 text-sm text-foreground">
                            {asset.remarks}
                        </p>
                    </div>
                )}

                <div>
                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        Current Status
                    </span>

                    <div className="mt-2 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={asset.status} />
                            <span className="text-sm text-muted-foreground">
                                {asset.status === 'available' &&
                                    'This asset is currently available.'}
                                {asset.status === 'borrowed' &&
                                    'This asset is currently borrowed.'}
                                {asset.status === 'under_repair' &&
                                    'This asset is currently under repair.'}
                                {asset.status === 'disposed' &&
                                    'This asset has been pulled out.'}
                                {asset.status === 'lost' &&
                                    'This asset has been reported as lost.'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}