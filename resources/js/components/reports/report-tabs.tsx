import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportView } from "@/types/reports";

interface ReportTabsProps {
    view: ReportView;
    overdueCount: number;
    lostCount: number;
    onChange(value: ReportView): void;
}

export function ReportTabs({
    view,
    overdueCount,
    lostCount,
    onChange,
}: ReportTabsProps) {
    return (
        <Tabs
            value={view}
            onValueChange={(value) => onChange(value as ReportView)}
        >
            <TabsList>
                <TabsTrigger className="cursor-pointer" value="assets">
                    Asset Report
                </TabsTrigger>

                <TabsTrigger className="cursor-pointer" value="overdue">
                    Overdue Items
                    {overdueCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {overdueCount}
                        </span>
                    )}
                </TabsTrigger>

                <TabsTrigger className="cursor-pointer" value="lost">
                    Lost Items
                    {lostCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {lostCount}
                        </span>
                    )}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}