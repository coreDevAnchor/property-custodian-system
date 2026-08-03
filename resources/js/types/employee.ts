import type { BorrowBrief } from './borrows';
import type { BaseFilters, UserRef } from './common';

export type EmployeeStatusFilter = 'All' | 'active' | 'inactive';

export interface Employee {
    id: number;
    department: string;
    employee_id?: string | null;
    contact?: string | null;
    is_active: boolean;

    user: UserRef;

    borrows?: BorrowBrief[];
}

export interface Filters extends BaseFilters {
    search: string;
    status: EmployeeStatusFilter;
}
