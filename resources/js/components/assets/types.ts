
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
<<<<<<< HEAD

    asset_type: AssetType;
=======
    assetTypes: AssetType;
>>>>>>> 6fa5aa3244c5a6bb9d156e0bc87f7fed1036a5e6

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