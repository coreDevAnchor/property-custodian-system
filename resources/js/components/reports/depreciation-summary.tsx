import {
    Calculator,
    Coins,
    Package,
    TrendingDown,
} from 'lucide-react';

import { DepreciationSummary } from '@/types/reports';

interface Props {
    data: DepreciationSummary;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function DepreciationSummaryCard({
    data,
}: Props) {
    const cards = [
        {
            label: 'Total Asset Value',
            value: formatCurrency(data.totalAssetValue),
            description: `Across ${data.assetCount.toLocaleString()} assets`,
            icon: Coins,
        },
        {
            label: 'Total Depreciation',
            value: formatCurrency(data.totalDepreciation),
            description: 'Calculated depreciation value',
            icon: TrendingDown,
        },
        {
            label: 'Current Estimated Value',
            value: formatCurrency(data.currentEstimatedValue),
            description: 'Asset value after depreciation',
            icon: Calculator,
        },
    ];

    return (
        <section>
            <div className="mb-4">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Asset Valuation & Depreciation
                </h2>

                <p className="text-sm text-muted-foreground">
                    Overview of the current financial value of all assets
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.label}
                            className="rounded-xl border border-border bg-card p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {card.label}
                                    </p>

                                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                                        {card.value}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Icon className="size-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

