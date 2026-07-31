import { BarChart3, Clock3, PackageX } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportView } from "@/types/reports";

interface Props {
    view: ReportView;
    onViewChange: (view: ReportView) => void;
}

const tabs = [
    {
        value: "assets",
        label: "Assets",
        icon: BarChart3,
    },
    {
        value: "overdue",
        label: "Overdue",
        icon: Clock3,
    },
    {
        value: "lost",
        label: "Lost",
        icon: PackageX,
    },
] satisfies {
    value: ReportView;
    label: string;
    icon: React.ElementType;
}[];

export function TableReportSwitches({
    view,
    onViewChange,
}: Props) {
    return (
        <div className="inline-flex rounded-lg border bg-muted p-1">
            {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.value}
                        onClick={() => onViewChange(tab.value)}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                            view === tab.value
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}