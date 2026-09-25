import { Head, usePage } from '@inertiajs/react';
import { ArrowLeft, PackageSearch } from 'lucide-react';

import { AssetDetailPanel } from '@/components/assets/asset-detail-panel';
import { Button } from '@/components/ui/button';
import custodianAssets from '@/routes/custodian/assets';
import employeeAssets from '@/routes/employee/assets';
import type { Asset } from '@/types/assets';

export default function AssetDetail({ asset }: { asset: Asset }) {
    const { auth } = usePage().props as { auth: { user?: { role?: string } } };
    const isEmployee = auth.user?.role === 'employee';
    const backHref = isEmployee
        ? employeeAssets.index().url
        : custodianAssets.index().url;

    return (
        <>
            <Head title={`Asset · ${asset.name}`} />

            <div className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">
                                {asset.name}
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                <PackageSearch className="size-3.5" />
                                {asset.asset_tag}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Scan the QR code on this asset to open this page.
                        </p>
                    </div>

                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        asChild
                    >
                        <a href={backHref}>
                            <ArrowLeft className="size-4" />
                            {isEmployee ? 'Browse assets' : 'Back to assets'}
                        </a>
                    </Button>
                </div>

                <AssetDetailPanel asset={asset} readOnly={isEmployee} />
            </div>
        </>
    );
}