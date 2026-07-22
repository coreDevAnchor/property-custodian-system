import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    IdCard,
    Mail,
    Pencil,
    Phone,
    UserRound,
    Wallet,
} from 'lucide-react';

interface EmployeeBorrow {
    id: number;
    status: string;
    requested_at: string;
    returned_at?: string | null;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        acquisition_cost?: number | string | null;
        acquisition_date?: string | null;
        depreciation_rate?: number | string | null;
    };
}

interface Employee {
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

const BORROWS_PER_PAGE = 5;

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

function StatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
                }`}
        >
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

function BorrowStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending:
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        borrowed:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        awaiting_check:
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        returned:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected:
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const labels: Record<string, string> = {
        pending: 'Pending',
        borrowed: 'Borrowed',
        awaiting_check: 'Awaiting Check',
        returned: 'Returned',
        rejected: 'Rejected',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status] ?? 'bg-muted text-muted-foreground'
                }`}
        >
            {labels[status] ?? status}
        </span>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                    {value || <span className="text-muted-foreground">—</span>}
                </p>
            </div>
        </div>
    );
}

interface Props {
    open: boolean;
    employee?: Employee;
    onOpenChange: (open: boolean) => void;
    onEdit?: (employee: Employee) => void;
}

export function EmployeeViewDialog({ open, employee, onOpenChange, onEdit }: Props) {
    const [page, setPage] = useState(1);

    // Reset to the first page whenever the dialog is opened for a
    // (possibly different) employee, so pagination doesn't carry over.
    useEffect(() => {
        if (open) {
            setPage(1);
        }
    }, [open, employee?.id]);

    const borrows = employee?.borrows ?? [];

    const totalBorrowedValue = useMemo(
        () =>
            borrows
                .filter((borrow) => borrow.status === 'borrowed')
                .reduce(
                    (sum, borrow) => sum + (Number(borrow.asset.acquisition_cost) || 0),
                    0
                ),
        [borrows]
    );

    const currentlyBorrowedCount = useMemo(
        () => borrows.filter((borrow) => borrow.status === 'borrowed').length,
        [borrows]
    );

    const totalPages = Math.max(1, Math.ceil(borrows.length / BORROWS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedBorrows = borrows.slice(
        (currentPage - 1) * BORROWS_PER_PAGE,
        currentPage * BORROWS_PER_PAGE
    );

    if (!employee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4 pr-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/50">
                                <UserRound className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <DialogTitle>{employee.user.name}</DialogTitle>
                                <DialogDescription>
                                    {employee.employee_id ?? 'No employee ID assigned'}
                                </DialogDescription>
                            </div>
                        </div>
                        <StatusBadge isActive={employee.is_active} />
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailRow icon={Mail} label="Email" value={employee.user.email} />
                    <DetailRow
                        icon={Building2}
                        label="Department"
                        value={employee.department}
                    />
                    <DetailRow icon={Phone} label="Contact" value={employee.contact} />
                    <DetailRow
                        icon={IdCard}
                        label="Employee ID"
                        value={employee.employee_id}
                    />
                </div>

                {/* ── Total value of currently borrowed items ── */}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Wallet className="size-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-lg font-extrabold tracking-tight text-primary">
                            {currencyFormatter.format(totalBorrowedValue)}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Total acquisition cost of {currentlyBorrowedCount}{' '}
                            {currentlyBorrowedCount === 1 ? 'item' : 'items'} currently
                            borrowed
                        </p>
                    </div>
                </div>

                {/* ── Borrow history ── */}
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Borrow History
                    </span>

                    <div className="mt-2 space-y-2 rounded-lg border border-border p-3">
                        {paginatedBorrows.length ? (
                            paginatedBorrows.map((borrow) => (
                                <div
                                    key={borrow.id}
                                    className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {borrow.asset.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {borrow.asset.asset_tag} ·{' '}
                                            {new Date(
                                                borrow.requested_at
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <BorrowStatusBadge status={borrow.status} />
                                        {borrow.asset.acquisition_cost != null && (
                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                {currencyFormatter.format(
                                                    Number(borrow.asset.acquisition_cost) || 0
                                                )}{' '}
                                                cost
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No borrowing history.
                            </p>
                        )}
                    </div>

                    {borrows.length > BORROWS_PER_PAGE && (
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-7"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setPage((p) => Math.min(totalPages, p + 1))
                                    }
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>

                    {onEdit && (
                        <Button
                            onClick={() => {
                                onOpenChange(false);
                                onEdit(employee);
                            }}
                        >
                            <Pencil className="size-4" />
                            Edit Employee
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}