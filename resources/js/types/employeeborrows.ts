export type BorrowStatus = 'pending' | 'borrowed' | 'awaiting_check' | 'returned' | 'rejected';

export interface BorrowItem {
    id: number;
    status: BorrowStatus;
    requested_at: string;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: {
            id: number;
            name: string;
        };
    };
}


export interface Stats {
    availableAssets: number;
    activeBorrows: number;
    pendingRequests: number;
    totalBorrowed: number;
}

export interface Filters {
    current_per_page: number;
    activity_per_page: number;
}