export interface EmployeeBorrow {
    id: number;
    status: string;
    requested_at: string;
    returned_at?: string | null;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
    };
}

export interface Employee {
    id: number;
    department: string;
    employee_id?: string | null;
    contact?: string | null;
    is_active: boolean;

    user: {
        id: number;
        name: string;
        email: string;
    };

    borrows?: EmployeeBorrow[];
}

export interface Filters {
    search: string;
    status: string;
    per_page: number;
}