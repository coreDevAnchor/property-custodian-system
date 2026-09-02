// @/components/assets/types.ts
// Canonical types live in @/types/assets and @/types/categories.

export type {
    Asset,
    AssetFormValues,
    AssetStatus,
    AssetType,
} from '@/types/assets';

export type { Category } from '@/types/categories';

export interface ImportPreviewRow {
    row: number;
    name: string;
    category: string;
    asset_type: string;
    amount: number;
    unit_type: 'single' | 'multi';
    category_status: 'existing' | 'new';
    asset_type_status: 'existing' | 'new';
}

export interface ImportPreviewSummary {
    total: number;
    single: number;
    multi: number;
    categories_existing: number;
    categories_new: number;
    asset_types_existing: number;
    asset_types_new: number;
}

export interface ImportPreview {
    summary: ImportPreviewSummary;
    rows: ImportPreviewRow[];
}
