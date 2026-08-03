import type { AssetSummary, BaseFilters, EntityRef } from './common';

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
    lost_reason?: string | null;

    asset: AssetSummary;

    borrower: EntityRef;

    checked_by?: EntityRef | null;

    approved_by?: EntityRef | null;
}

export type SortKey = 'newest' | 'oldest' | 'borrower_az' | 'borrower_za';

export interface Filters extends BaseFilters {
    search: string;
    status: 'All' | ReturnStatus;
    sort: SortKey;
}
