import { Coins, Package, Wallet  } from "lucide-react";
import type {LucideIcon} from "lucide-react";
import { useEffect, useRef } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";


import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ReportPeriod } from "@/types/reports"

import type { DepreciationSummary } from "@/types/reports";


function MiniStat({
    icon: Icon,
    title,
    value,
    color,
    bg,
    currency = false,
}: {
    icon: LucideIcon;
    title: string;
    value: number;
    color: string;
    bg: string;
    currency?: boolean;
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
                    decimals={currency ? 2 : 0}
                />
            </p>
        </div>
    );
}

interface Props {
    data: DepreciationSummary;
    period: ReportPeriod;
    onPeriodChange: (period: ReportPeriod) => void;
}

export function AssetValuationCard({ data, period, onPeriodChange }: Props) {

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Asset Valuation</CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Current inventory value
                    </p>
                </div>

                <Select
                    value={period}
                    onValueChange={(value) => onPeriodChange(value as ReportPeriod)}
                >
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MiniStat
                    icon={Coins}
                    title="Total Asset Value"
                    value={data.totalAssetValue}
                    bg="bg-orange-100"
                    color="text-orange-600"
                />

                <MiniStat
                    icon={Wallet}
                    title="Current Estimated Value"
                    value={data.totalAssetValue}
                    bg="bg-green-100"
                    color="text-green-600"
                />

                <MiniStat
                    icon={Package}
                    title="Total Assets"
                    value={data.assetCount}
                    bg="bg-blue-100"
                    color="text-blue-600"
                />
            </CardContent>
        </Card>
    );
}