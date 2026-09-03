import { useMemo, useState } from "react";

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

import type { ReportPeriod } from "@/types/reports";

import type { BorrowerAnalytics } from "@/types/reports";

type Metric =
    | "borrowers"
    | "returners"
    | "onTimeReturners"
    | "defectiveReturns"
    | "lostItems";

interface Props {
    data: BorrowerAnalytics;
    period: ReportPeriod;
    onPeriodChange: (period: ReportPeriod) => void;
}

export function TopEmployeeCard({ data, period, onPeriodChange }: Props) {
    const [metric, setMetric] = useState<Metric>("borrowers");

    const ranking = useMemo(() => {
        return [...data[metric]]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [metric, data]);



    return (
        <div className="rounded-2xl border bg-card shadow-sm">

            <div className="border-b p-5">

                <h2 className="font-semibold text-lg">

                    Top Employees

                </h2>

                <p className="text-sm text-muted-foreground">

                    Employee performance rankings

                </p>

            </div>

            <div className="flex gap-3 p-5">
                <Select
                    value={metric}
                    onValueChange={(v) => setMetric(v as Metric)}
                >

                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                        <SelectItem value="borrowers">
                            Top Borrowers
                        </SelectItem>

                        <SelectItem value="returners">
                            Top Returners
                        </SelectItem>

                        <SelectItem value="onTimeReturners">
                            Best On-Time
                        </SelectItem>

                        <SelectItem value="defectiveReturns">
                            Most Defective
                        </SelectItem>

                        <SelectItem value="lostItems">
                            Most Lost
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={period}
                    onValueChange={(value) =>
                        onPeriodChange(value as ReportPeriod)
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="today">
                            Today
                        </SelectItem>

                        <SelectItem value="week">
                            This Week
                        </SelectItem>

                        <SelectItem value="month">
                            This Month
                        </SelectItem>


                        <SelectItem value="year">
                            This Year
                        </SelectItem>
                    </SelectContent>
                </Select>

            </div>

            <div className="divide-y">
                {ranking.map((employee, index) => {
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;

                    return (
                        <div
                            key={employee.borrower_id}
                            className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/40 transition-colors"
                        >

                            <div className="flex items-center gap-3">

                                <div className="text-xl">
                                    {medal}
                                </div>

                                <div>

                                    <p className="font-semibold">

                                        {employee.borrower}

                                    </p>

                                    <p className="text-xs text-muted-foreground">

                                        Employee

                                    </p>

                                </div>

                            </div>
                            {ranking.length === 0 ? (
                                <div className="p-12 text-center">
                                    No analytics available.
                                </div>
                            ) : (
                                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-600">
                                    {employee.count}
                                </span>
                            )}
                        </div>
                    )
                })}

            </div>
        </div>
    )
}