import type { BorrowBrief } from './borrows';
import type { BaseFilters } from './common';

export interface Custodian {
    id: number;
    name: string;
    email: string;
    created_at: string;
    borrows?: BorrowBrief[];
}

export interface Filters extends BaseFilters {
    search: string;
}
