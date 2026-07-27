
export interface Custodian {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export interface Filters {
    search: string;
    per_page: number;
}
