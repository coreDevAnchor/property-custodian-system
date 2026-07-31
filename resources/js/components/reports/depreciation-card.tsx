import { useEffect } from "react";
import { Coins, Package, Wallet, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "../ui/animated-number";
import { useRef } from "react";

import {
    TrendingDown,
    Percent,
    WalletCards,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { DepreciationSummary } from "@/types/reports";
import { ReportPeriod } from "@/types/reports";


function MiniStat({
    icon: Icon,
    title,
    value,
    color,
    bg,
    currency = false,
    percentage = false,
}: {
    icon: LucideIcon;
    title: string;
    value: number;
    color: string;
    bg: string;
    currency?: boolean;
    percentage: boolean
}) {
    const previous = useRef(value);
    const from = previous.current;

    useEffect(() => {
        previous.current = value;
    }, [value]);

    return (
        <div className="rounded-xl border p-5 transition hover:shadow-md">
            <div className={`mb-4 inline-flex rounded-lg p-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>

            <p className="text-sm text-muted-foreground">
                {title}
            </p>

            <p className="mt-2 text-xl font-bold">
                <AnimatedNumber
                    from={from}
                    to={value}
                    prefix={currency ? "₱" : ""}
                    suffix={percentage ? "%" : ""}
                    decimals={currency ? 2 : 0}
                />
            </p>
        </div>
    );
}


interface Props {
    data: DepreciationSummary;
}

export function DepreciationCard({ data }: Props) {

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Depreciation</CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Asset depreciation overview
                    </p>
                </div>


            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Total Depreciation */}
                <MiniStat
                    icon={TrendingDown}
                    title="Total Depreciation"
                    value={data.totalDepreciation}
                    bg="bg-red-100"
                    color="text-red-600"
                    currency
                    percentage={false}
                />

                {/* Average Depreciation Rate */}
                <MiniStat
                    icon={Percent}
                    title="Average Depreciation Rate"
                    value={data.averageDepreciationRate}
                    bg="bg-yellow-100"
                    color="text-yellow-600"
                    percentage
                />

                {/* Remaining Asset Value */}
                <MiniStat
                    icon={WalletCards}
                    title="Remaining Asset Value"
                    value={data.currentEstimatedValue}
                    bg="bg-green-100"
                    color="text-green-600"
                    currency
                    percentage={false}
                />

            </CardContent>
        </Card>
    );
}