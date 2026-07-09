import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Employee {
    id: number;
    user: { name: string };
    employee_id?: string | null;
}

export function EmployeeDeleteDialog({
    employee,
    onCancel,
    onConfirm,
}: {
    employee: Employee | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="size-5 text-red-500" />
                    </div>
                    <DialogTitle className="mt-4">Remove this employee?</DialogTitle>
                    <DialogDescription>
                        {employee && (
                            <>
                                <span className="font-semibold text-foreground">
                                    {employee.user.name}
                                </span>
                                {employee.employee_id && ` (${employee.employee_id})`} will be
                                permanently removed. This action cannot be undone.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-500 text-white hover:bg-red-600"
                    >
                        Remove Employee
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}