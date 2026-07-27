export interface Borrow {
    id: number;
    status: string;
    requested_at: string;
    returned_at?: string | null;

    borrower: Borrower;
}

export interface Borrower {
    id: number;
    name: string;
}