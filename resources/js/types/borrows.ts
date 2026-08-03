import type { AssetRef, AssetSummary, BaseFilters, EntityRef } from './common';

export type BorrowStatus =
    | 'pending'
    | 'borrowed'
    | 'awaiting_check'
    | 'returned'
    | 'rejected';

export type ActiveBorrowStatus = Extract<
    BorrowStatus,
    'pending' | 'borrowed' | 'awaiting_check'
>;

export type SortKey = 'newest' | 'oldest' | 'requester_az' | 'requester_za';

export interface Borrow {
    id: number;
    status: BorrowStatus;
    requested_at: string;
    returned_at?: string | null;

    borrower: EntityRef;
}

export interface BorrowedAssetRef extends AssetRef {
    acquisition_cost?: number | string | null;
    acquisition_date?: string | null;
    depreciation_rate?: number | string | null;
}

export interface BorrowBrief {
    id: number;
    status: BorrowStatus;
    requested_at: string;
    returned_at?: string | null;

    asset: BorrowedAssetRef;
}

export interface BorrowItem {
    id: number;
    status: BorrowStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    returned_at?: string | null;
    expected_return_date?: string | null;

    asset: AssetSummary;
}

export interface BorrowRequest {
    id: number;
    status: BorrowStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    returned_at?: string | null;
    expected_return_date?: string | null;

    asset: AssetSummary;

    borrower: EntityRef;

    approved_by?: EntityRef | null;

    checked_by?: EntityRef | null;
}

export interface BorrowRenewalRequest {
    id: number;
    requested_due_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    borrow: BorrowRequest;
}

export interface BorrowCounts {
    borrowed: number;
    pending: number;
    awaiting_check: number;
}

export interface Filters extends BaseFilters {
    search: string;
    status: 'All' | BorrowStatus;
    sort: SortKey;
}

export interface CurrentBorrowFilters extends BaseFilters {
    status: 'All' | ActiveBorrowStatus;
}

export interface DashboardFilters {
    current_per_page: number;
    activity_per_page: number;
}

export interface Stats {
    availableAssets: number;
    activeBorrows: number;
    pendingRequests: number;
    totalBorrowed: number;
}
