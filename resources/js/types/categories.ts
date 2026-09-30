export type BorrowPolicy = 'returnable' | 'consumable';

export const borrowPolicyLabels: Record<BorrowPolicy, string> = {
    returnable: 'Returnable',
    consumable: 'Consumable',
};

export interface Category {
    id: number;
    name: string;
    prefix?: string;
    description?: string | null;
    unit_type?: 'single' | 'multi';
    borrow_policy?: BorrowPolicy;
}