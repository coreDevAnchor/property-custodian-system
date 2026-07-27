export interface ActivityItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
    asset?: { id: number; name: string; asset_tag: string } | null;
    actor?: { id: number; name: string } | null;
}

export type Category = 'All' | 'assets' | 'borrow_requests' | 'returns';
export type DateRange = 'all' | '24h' | '7d' | '30d';

export interface Filters {
    category: Category;
    range: DateRange;
    per_page: number;
}