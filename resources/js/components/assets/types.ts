// @/components/assets/types.ts

export interface AssetType {
    id: number;
    name: string;
    prefix: string;

    category: {
        id: number;
        name: string;
    };
}

export type AssetStatus =
    | 'available'
    | 'borrowed'
    | 'under_repair'
    | 'disposed';

export interface Borrow {
    id: number;
    status: string;
    requested_at: string;
    returned_at?: string | null;

    employee: {
        id: number;

        user: {
            name: string;
        };
    };
}

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

    asset_type?: AssetType | null;

    category: {
        id: number;
        name: string;
    };

    location?: {
        id: number;
        name: string;
    } | null;

    borrows?: Borrow[];
}

export interface Category {
    id: number;
    name: string;
}

export interface AssetFormValues {
    name: string;
    asset_tag: string;
    category_id: number;
    location_id: number;
    status: string;
    acquisition_date: string;
    description?: string;
    serial_number?: string;
}