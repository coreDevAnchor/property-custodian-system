import type { AssetRef, BaseFilters, EntityRef } from './common';

export interface ActivityItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
    asset?: AssetRef | null;
    actor?: EntityRef | null;
}

export type Category = 'All' | 'assets' | 'borrow_requests' | 'returns';
export type DateRange = 'all' | '24h' | '7d' | '30d';

export interface Filters extends BaseFilters {
    category: Category;
    range: DateRange;
}
