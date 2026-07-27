import { Category } from './categories';

export interface Borrow {
    id: number;
    status: string;
    requested_at: string;
    returned_at?: string | null;

    borrower: Borrower;
}

export interface Borrower {
    id: number;
    name: string;
}

export type BorrowStatus =
    | 'pending'
    | 'borrowed'
    | 'awaiting_check'
    | 'returned'
    | 'rejected';

export interface BorrowRequest {
    id: number;
    status: BorrowStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    returned_at?: string | null;
    expected_return_date?: string | null;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: Category;
    };

    borrower: Borrower;

    approved_by?: {
        id: number;
        name: string;
    } | null;

    checked_by?: {
        id: number;
        name: string;
    } | null;
}

export type SortKey = 'newest' | 'oldest' | 'requester_az' | 'requester_za';

export interface Filters {
    search: string;
    status: 'All' | BorrowStatus;
    sort: SortKey;
    per_page: number;
}