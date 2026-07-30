export interface CustodianBorrow {
    id: number;
    status: string;
    requested_at: string;
    asset: {
        name: string;
        asset_tag: string;
    };
}

export interface Custodian {
    id: number;
    name: string;
    email: string;
    created_at: string;
    borrows?: CustodianBorrow[];
}

export interface Filters {
    search: string;
    per_page: number;
}