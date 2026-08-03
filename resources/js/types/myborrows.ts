export type BorrowStatus = 'pending' | 'borrowed' | 'awaiting_check' | 'returned' | 'rejected';

export interface BorrowItem {
    id: number;
    status: BorrowStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    returned_at?: string | null;

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