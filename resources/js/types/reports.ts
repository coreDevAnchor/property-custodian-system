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

export interface MonthlyUsagePoint {
    month: string;
    label: string;
    count: number;
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
}