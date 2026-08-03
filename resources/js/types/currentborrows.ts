export type BorrowStatus = 'pending' | 'borrowed' | 'awaiting_check';

export interface BorrowItem {
    id: number;
    status: BorrowStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    expected_return_date: string;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        photo?: string | null;
        description?: string | null;
        category: {
            id: number;
            name: string;
        };
        location?: {
            id: number;
            name: string;
        } | null;
    };
}

export interface BorrowCounts {
    borrowed: number;
    pending: number;
    awaiting_check: number;
}

export interface Filters {
    status: 'All' | BorrowStatus;
    per_page: number;
}