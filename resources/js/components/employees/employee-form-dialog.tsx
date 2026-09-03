import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { employeeSchema } from './employee-schema';

type FormValues = z.infer<typeof employeeSchema>;

interface EmployeeUser {
    id: number;
    name: string;
    email: string;
}

interface Employee {
    id: number;
    department: string;
    employee_id?: string | null;
    contact?: string | null;
    is_active: boolean;
    user: EmployeeUser;
}

interface Props {
    open: boolean;
    mode: 'create' | 'edit';
    employee?: Employee;
    onOpenChange: (open: boolean) => void;
    nextEmployeeId: string;
}

const departments = [
    'IT Department',
    'Human Resources',
    'Finance',
    'Accounting',
    'Administration',
    'Procurement',
    'Maintenance',
];

export function EmployeeFormDialog({
    open,
    mode,
    employee,
    onOpenChange,
    nextEmployeeId,
}: Props) {
    const form = useForm<FormValues>({
        resolver: zodResolver(employeeSchema),

        defaultValues: {
            name: '',
            email: '',
            password: 'Password123!',
            department: '',
            employee_id: '',
            contact: '',
            is_active: true,
        },
    });

    useEffect(() => {
        if (mode === 'edit' && employee) {
            form.reset({
                name: employee.user.name,
                email: employee.user.email,
                password: '',
                department: employee.department,
                employee_id: employee.employee_id ?? '',
                contact: employee.contact ?? '',
                is_active: Boolean(employee.is_active),
            });
        }

        if (mode === 'create') {
            form.reset({
                name: '',
                email: '',
                password: '',
                department: '',
                employee_id: '',
                contact: '',
                is_active: true,
            });
        }
    }, [employee, mode]);

    const submit = (data: FormValues) => {
        const payload = {
            name: data.name,
            email: data.email,
            department: data.department,
            contact: data.contact,
            employee_id:
                mode === 'create' ? nextEmployeeId : employee?.employee_id,
            is_active: data.is_active,
        };

        if (mode === 'create') {
            router.post('/custodian/employees', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (errors) => {
                    if (errors.email) {
                        form.setError('email', {
                            type: 'server',
                            message: errors.email,
                        });
                    }
                },
            });
        } else {
            router.put(`/custodian/employees/${employee?.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (errors) => {
                    if (errors.email) {
                        form.setError('email', {
                            type: 'server',
                            message: errors.email,
                        });
                    }
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Add Employee' : 'Edit Employee'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? 'Create a new employee account.'
                            : 'Update employee information.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(submit)}
                        className="space-y-6"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Juan Dela Cruz"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="juan@company.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="password"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>

                                    <FormControl>
                                        <Input
                                            type="text"
                                            value="Password123!"
                                            readOnly
                                            className="cursor-not-allowed bg-muted"
                                        />
                                    </FormControl>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Default password: Password123! Employee
                                        should change it after first login.
                                    </p>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>

                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                {departments.map(
                                                    (department) => (
                                                        <SelectItem
                                                            key={department}
                                                            value={department}
                                                        >
                                                            {department}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                value={
                                                    mode === 'create'
                                                        ? nextEmployeeId
                                                        : (employee?.employee_id ??
                                                          '')
                                                }
                                                disabled
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="contact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="09123456789"
                                            maxLength={11}
                                            inputMode="numeric"
                                            value={field.value}
                                            onChange={(e) => {
                                                const value =
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    );

                                                if (value.length <= 11) {
                                                    field.onChange(value);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div>
                                        <FormLabel className="text-sm">
                                            Active
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            Inactive employees can't be assigned
                                            new borrows.
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={!!field.value}
                                            onCheckedChange={(checked) =>
                                                field.onChange(checked)
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                className="cursor-pointer"
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button className="cursor-pointer" type="submit">
                                {mode === 'create'
                                    ? 'Add Employee'
                                    : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
