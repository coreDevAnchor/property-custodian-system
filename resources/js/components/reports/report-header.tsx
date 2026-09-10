import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    period: string;
    onPeriodChange: (value: string) => void;
    onExport: () => void;
    onExportPdf: () => void;
}

export function ReportHeader({
    period,
    onPeriodChange,
    onExport,
    onExportPdf,
}: Props) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Reports
                </h1>

                <p className="mt-1 text-muted-foreground">
                    Property analytics, asset insights and inventory reports.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <Select
                    value={period}
                    onValueChange={onPeriodChange}
                >
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onExport} className="cursor-pointer">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>

                    <Button onClick={onExportPdf} className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}