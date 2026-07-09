
export interface AssetType {
    id: number;
    name: string;
    prefix: string;

    category: {
        id: number;
        name: string;
    };
}

type AssetStatus =
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
    description?: string;
    serial_number?: string;

    status: AssetStatus;
    acquisition_date: string;
    assetTypes: AssetType;

    category: {
        id: number;
        name: string;
    };

    location: {
        id: number;
        name: string;
    };

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