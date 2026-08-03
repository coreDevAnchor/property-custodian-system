import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Eye,
    Mail,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmployeeDeleteDialog } from '@/components/employees/employee-delete-dialog';
import { EmployeeFormDialog } from '@/components/employees/employee-form-dialog';
import { EmployeeViewDialog } from '@/components/employees/employee-views-dialog';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { PaginationBar } from '@/components/ui/pagination';
import { dashboard } from '@/routes/custodian';
import type { Employee, EmployeeStatusFilter, Filters } from '@/types/employee';
import type { Paginated } from '@/types/pagination';

// ─── Sub-components ─────────────────────────────────────────────────────────

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

function EmployeeRow({
    employee,
    onEdit,
    onDelete,
    onView,
}: {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
    onView: (employee: Employee) => void;
}) {
    const activeBorrows = employee.borrows?.filter(
        (b) => b.status === 'borrowed' || b.status === 'awaiting_check'
    );

    return (
        <tr
            onClick={() => onView(employee)}
            className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50">
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50">
                        <UserRound className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {employee.user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {employee.employee_id ?? '—'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="size-3.5" />
                    {employee.department}
                </div>
            </td>
            <td className="py-3.5 pr-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    <span className="truncate">{employee.user.email}</span>
                </div>
            </td>
            <td className="py-3.5 pr-4">
                {employee.contact ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="size-3.5" />
                        {employee.contact}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </td>
            <td className="py-3.5 pr-4">
                <StatusBadge isActive={employee.is_active} />
            </td>
            <td className="py-3.5">
                <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(employee);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500 cursor-pointer"
                        aria-label={`Edit ${employee.user.name}`}
                    >
                        <Pencil className="size-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(employee);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                        aria-label={`Remove ${employee.user.name}`}
                    >
                        <Trash2 className="size-4" />
                    </button>

                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                                aria-label={`View borrowed items for ${employee.user.name}`}
                            >
                                <Eye className="size-4" />
                            </button>
                        </HoverCardTrigger>

                        <HoverCardContent className="w-80">
                            <div className="space-y-3">
                                <h4 className="font-semibold">Borrowed Items</h4>

                                {activeBorrows?.length ? (
                                    activeBorrows.map((borrow) => (
                                        <div
                                            key={borrow.id}
                                            className="border-b border-border pb-2 last:border-0"
                                        >
                                            <div className="font-medium">
                                                {borrow.asset.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {borrow.asset.asset_tag}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Since{' '}
                                                {new Date(
                                                    borrow.requested_at
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No items currently borrowed.
                                    </p>
                                )}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </td>

        </tr>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface Props {
    employees: Paginated<Employee>;
    nextEmployeeId: string;
    filters: Filters;
}

export default function Employees({ employees, nextEmployeeId, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>(
        filters.status ?? 'All',
    );
    const [viewTarget, setViewTarget] = useState<Employee | undefined>();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

    // ── Server-driven filtering/pagination ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        router.get(
            '/custodian/employees',
            {
                search: overrides.search ?? search,
                status: overrides.status ?? statusFilter,
                per_page: overrides.per_page ?? employees.per_page,
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['employees', 'filters'] },
        );
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;

            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => fetchPage(1), 350);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function handleStatusChange(value: EmployeeStatusFilter) {
        setStatusFilter(value);
        fetchPage(1, { status: value });
    }

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    function openAddModal() {
        setEditingEmployee(undefined);
        setDialogOpen(true);
    }

    function openEditModal(employee: Employee) {
        setEditingEmployee(employee);
        setDialogOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/custodian/employees/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Employees" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                {/* ── Page header ── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Employees
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage employee records and accounts
                        </p>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="size-4" />
                        Add New Employee
                    </button>
                </div>

                {/* ── Filters + table ── */}
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, department…"
                                className="h-10 w-full rounded-lg border border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    handleStatusChange(e.target.value as EmployeeStatusFilter)
                                }
                                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            >
                                <option value="All">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Employee
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Department
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Email
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Contact
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="py-3 text-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.data.map((employee) => (
                                    <EmployeeRow
                                        key={employee.id}
                                        employee={employee}
                                        onEdit={openEditModal}
                                        onDelete={setDeleteTarget}
                                        onView={setViewTarget}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {employees.data.length === 0 && (
                            <div className="flex flex-col items-center gap-1 py-12 text-center">
                                <p className="text-sm font-semibold text-foreground">
                                    No employees found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        )}
                    </div>

                    <PaginationBar
                        currentPage={employees.current_page}
                        lastPage={employees.last_page}
                        total={employees.total}
                        from={employees.from}
                        to={employees.to}
                        perPage={employees.per_page}
                        itemLabel="employees"
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                </div>
            </div>

            <EmployeeFormDialog
                open={dialogOpen}
                mode={editingEmployee ? 'edit' : 'create'}
                employee={editingEmployee}
                onOpenChange={setDialogOpen}
                nextEmployeeId={nextEmployeeId}
            />

            <EmployeeDeleteDialog
                employee={deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />

            <EmployeeViewDialog
                open={!!viewTarget}
                employee={viewTarget}
                onOpenChange={(open) => !open && setViewTarget(undefined)}
                onEdit={openEditModal}
            />
        </>
    );
}

Employees.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Employees',
            href: '/custodian/employees',
        },
    ],
};