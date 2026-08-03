import type { AssetSummary, EntityRef } from './common';

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

export type { ActivityItem } from './activities';
