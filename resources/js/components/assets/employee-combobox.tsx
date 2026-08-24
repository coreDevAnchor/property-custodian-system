import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, User, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { OwnerCandidate } from '@/types/assets';

interface Props {
    employees: OwnerCandidate[];
    value?: number;
    onChange: (value: number | undefined) => void;
}

export function EmployeeCombobox({ employees, value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selected = employees.find((employee) => employee.id === value);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return employees;

        return employees.filter((employee) => {
            const name = employee.user?.name?.toLowerCase() ?? '';
            const employeeId = employee.employee_id?.toLowerCase() ?? '';
            const department = employee.department?.toLowerCase() ?? '';

            return (
                name.includes(query) ||
                employeeId.includes(query) ||
                department.includes(query)
            );
        });
    }, [employees, search]);

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) setSearch('');
            }}
        >
            <div className="relative w-full">
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={`w-full justify-between pr-8 font-normal ${selected ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <User className="size-4 shrink-0 text-muted-foreground" />

                            <span className="truncate">
                                {selected
                                    ? selected.user?.name ?? `Employee #${selected.id}`
                                    : 'Select original owner'}
                            </span>
                        </span>
                    </Button>
                </PopoverTrigger>

                {selected && (
                    <button
                        type="button"
                        aria-label="Clear original owner"
                        onClick={(event) => {
                            event.stopPropagation();
                            onChange(undefined);
                        }}
                        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
            >
                <div className="border-b border-border p-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, ID, or department..."
                            className="pl-8 h-9"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                            No employees found.
                        </p>
                    ) : (
                        filtered.map((employee) => {
                            const isSelected = employee.id === value;

                            return (
                                <button
                                    key={employee.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(employee.id);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors cursor-pointer ${isSelected ? 'bg-muted' : 'hover:bg-muted/60'}`}
                                >
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate font-medium text-foreground">
                                            {employee.user?.name ?? `Employee #${employee.id}`}
                                        </span>

                                        {(employee.employee_id || employee.department) && (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {[employee.employee_id, employee.department]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </span>
                                        )}
                                    </span>

                                    {isSelected && (
                                        <Check className="size-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
