import type { Borrow } from "./borrows";
import type { Category } from "./categories";
import { StagedImage } from "./images";
import type { Location } from "./location";

export type AssetStatus =
    | 'available'
    | 'borrowed'
    | 'under_repair'
    | 'disposed'
    | 'lost';

export const statusOptions: AssetStatus[] = [
    'available',
    'borrowed',
    'under_repair',
    'disposed',
    'lost',
];

export interface Asset {
    id: number;
    asset_tag: string;
    name: string;
    description: string | null;
    serial_number: string | null;
    remarks: string | null;
    photo: string | null;

    status: AssetStatus;
    acquisition_date: string | null;

    condition: number | null;
    acquisition_cost: number | string | null;
    depreciation_rate: number | string | null;
    total_depreciation?: number | string | null;

    asset_type?: AssetType | null;

    category: Category;

    location?: Location | null;

    borrows?: Borrow[];
}

export interface AssetFilters {
    search: string;
    category: string;
    status: 'All' | AssetStatus;
    per_page: number;
}

export interface AssetType {
    id: number;
    name: string;
    prefix: string;

    category: Category;
}

export interface AssetFormValues {
    name: string;
    category_id: number;
    asset_type_id: number;
    location_id: number;
    status: AssetStatus;
    acquisition_date: string;
    description?: string;
    serial_number?: string;
}