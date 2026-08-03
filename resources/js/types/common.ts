import type { Category } from './categories';
import type { Location } from './location';

export interface EntityRef {
    id: number;
    name: string;
}

export interface UserRef extends EntityRef {
    email: string;
}

export interface AssetRef {
    id: number;
    name: string;
    asset_tag: string;
}

export interface AssetSummary extends AssetRef {
    photo?: string | null;
    description?: string | null;
    category: Category;
    location?: Location | null;
}

export interface BaseFilters {
    per_page: number;
}
