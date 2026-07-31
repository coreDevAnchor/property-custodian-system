export interface OverdueItem {
    id: number;
    borrower: string | null;
    asset_name: string | null;
    asset_tag: string | null;
    category: string | null;
    expected_return_date: string;
    days_overdue: number;
}

export interface LostItem {
    id: number;
    name: string;
    asset_tag: string;
    category: string | null;
    asset_type: string | null;
    reported_at: string;
}

export type ReportView = 'assets' | 'overdue' | 'lost';
export type ReportPeriod = "today" | "week" | "month" | "year";

export interface MonthlyUsagePoint {
    month: string;
    label: string;

    // Overall monthly total
    count: number;

    // Borrow metrics
    pending?: number;
    returned?: number;
    rejected?: number;

    // Asset metrics
    good?: number;
    defective?: number;
    lost?: number;
}

export interface MonthlyAnalyticsPoint {
    month: string;
    label: string;
    borrower_id: number;
    borrower: string;
    count: number;
}

export interface BorrowerAnalytics {
    borrowers: MonthlyAnalyticsPoint[];
    returners: MonthlyAnalyticsPoint[];
    onTimeReturners: MonthlyAnalyticsPoint[];
    defectiveReturns: MonthlyAnalyticsPoint[];
    lostItems: MonthlyAnalyticsPoint[];
}

export interface DepreciationSummary {
    totalAssetValue: number;
    totalDepreciation: number;
    currentEstimatedValue: number;
    assetCount: number;
    averageDepreciationRate: number;
}

export type UsageMetric = 'borrows' | 'assets_added';

export interface ReturnConditionCounts {
    ok: number;
    defective: number;
    lost: number;
}

export interface AssetConditionCounts {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
}

// // export interface ReportSummary {
//     totalBorrowRequests: number;
//     approvedBorrows: number;
//     returnedBorrows: number;
//     returnConditions: ReturnConditionCounts;
//     assetConditions: AssetConditionCounts;
// }

export interface ReportSummary {
    totalAssets: number;
    totalBorrowRequests: number;
    approvedBorrows: number;
    returnedBorrows: number;
    overdueItems: number;
    lostAssets: number;
    defectiveAssets: number;
    totalAssetValue: number;
    totalDepreciation: number;
    currentEstimatedValue: number;
    returnConditions: ReturnConditionCounts;
    assetConditions: AssetConditionCounts;
}
