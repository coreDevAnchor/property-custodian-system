import { useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";

import { AnimatedNumber } from "../ui/animated-number";

interface Props {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    currency?: boolean;
}

export function ReportSummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
    currency = false,
}: Props) {
    const previous = useRef(
        typeof value === "number" ? value : 0
    );

    const from = previous.current;

    console.log({
        title,
        value,
        type: typeof value,
    });

    useEffect(() => {
        if (typeof value === "number") {
            previous.current = value;
        }
    }, [value]);

    return (
        <div className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">
                        {typeof value === "number" ? (
                            <AnimatedNumber
                                from={from}
                                to={value}
                                prefix={currency ? "₱" : ""}
                                decimals={currency ? 2 : 0}
                            />
                        ) : (
                            value
                        )}
                    </h2>

                    {subtitle && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="rounded-xl bg-orange-100 p-3 dark:bg-orange-900/30">
                    <Icon className="h-5 w-5 text-orange-500" />
                </div>
            </div>
        </div>
    );
}