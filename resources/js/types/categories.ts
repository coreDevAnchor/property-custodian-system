export interface Category {
    id: number;
    name: string;
    prefix?: string;
    description?: string | null;
    unit_type?: 'single' | 'multi';
}