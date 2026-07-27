import type { Borrower } from "./borrows";
import type { Category } from "./categories";

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

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: Category;
    };

    borrower: Borrower | null;
}

export interface CategoryBreakdown {
    label: string;
    count: number;
}

export interface ActivityItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
    asset?: { id: number; name: string; asset_tag: string } | null;
    actor?: { id: number; name: string } | null;
}

