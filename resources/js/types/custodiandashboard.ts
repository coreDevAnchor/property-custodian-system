import type { AssetSummary, EntityRef } from './common';
import type {
    DepartmentStat,
    DepreciationGranularity,
    DepreciationPoint,
} from './reports';

export interface Stats {
    totalAssets: number;
    availableAssets: number;
    borrowedOut: number;
    pendingRequests: number;
    awaitingReturns: number;
}

export interface PendingRequest {
    id: number;
    requested_at: string;
    remarks?: string | null;

    asset: AssetSummary;

    borrower: EntityRef | null;
}

export interface CategoryBreakdown {
    label: string;
    count: number;
}

export type { DepartmentStat, DepreciationGranularity, DepreciationPoint };
export type { ActivityItem } from './activities';
