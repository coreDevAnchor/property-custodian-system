import { Borrower } from "./borrows";

export type ReturnStatus = 'awaiting_check' | 'returned';
export type ReturnCondition = 'ok' | 'defective' | 'lost';

export interface ReturnItem {
    id: number;
    status: ReturnStatus;
    remarks?: string | null;
    requested_at: string;
    approved_at?: string | null;
    returned_at?: string | null;
    return_condition?: ReturnCondition | null;
    is_acknowledged: boolean;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: {
            id: number;
            name: string;
        };
    };

    borrower: Borrower

    checked_by?: {
        id: number;
        name: string;
    } | null;

    approved_by?: {
        id: number;
        name: string;
    } | null;

}

export type SortKey = 'newest' | 'oldest' | 'borrower_az' | 'borrower_za';

export interface Filters {
    search: string;
    status: 'All' | ReturnStatus;
    sort: SortKey;
    per_page: number;
}