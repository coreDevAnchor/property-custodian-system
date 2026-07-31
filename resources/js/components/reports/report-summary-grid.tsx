import {
    Package,
    PackageCheck,
    PackageSearch,
    PackageX,
    AlertTriangle,
    PhilippinePeso,
    Wrench,
    ClipboardCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { ReportSummaryCard } from "./reports-summary-card";
import { ReportSummary } from "@/types/reports";

interface Props {
    data: ReportSummary;
}

export function ReportSummaryGrid({ data }: Props) {
    ;

    return (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <ReportSummaryCard
                title="Assets"
                value={data.totalAssets}
                subtitle="Inventory"
                icon={Package}
            />

            <ReportSummaryCard
                title="Borrow Requests"
                value={data.totalBorrowRequests}
                subtitle="All requests"
                icon={PackageSearch}
            />

            <ReportSummaryCard
                title="Approved"
                value={data.approvedBorrows}
                subtitle="Approved borrows"
                icon={ClipboardCheck}
            />

            <ReportSummaryCard
                title="Returned"
                value={data.returnedBorrows}
                subtitle="Completed"
                icon={PackageCheck}
            />

            <ReportSummaryCard
                title="Asset Value"
                value={Number(data.totalAssetValue)}
                subtitle="Current inventory"
                icon={PhilippinePeso}
                currency={true}
            />

            <ReportSummaryCard
                title="Overdue"
                value={data.overdueItems}
                subtitle="Need attention"
                icon={AlertTriangle}
            />

            <ReportSummaryCard
                title="Lost"
                value={data.lostAssets}
                subtitle="Unavailable"
                icon={PackageX}
            />

            <ReportSummaryCard
                title="Defective"
                value={data.defectiveAssets}
                subtitle="Needs repair"
                icon={Wrench}
            />

        </div>
    );
}