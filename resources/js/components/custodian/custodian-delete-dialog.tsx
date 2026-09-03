import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Custodian {
    id: number;
    name: string;
}

export function CustodianDeleteDialog({
    custodian,
    onCancel,
    onConfirm,
    processing = false,
}: {
    custodian: Custodian | null;
    onCancel: () => void;
    onConfirm: () => void;
    processing?: boolean;
}) {
    return (
        <Dialog open={!!custodian} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="size-5 text-red-500" />
                    </div>
                    <DialogTitle className="mt-4">Remove this custodian?</DialogTitle>
                    <DialogDescription>
                        {custodian && (
                            <>
                                <span className="font-semibold text-foreground">
                                    {custodian.name}
                                </span>{' '}
                                will no longer be able to access the custodian dashboard.
                                This action cannot be undone.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        className="cursor-pointer"
                        variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={processing}
                        className="cursor-pointer bg-red-500 text-white hover:bg-red-600"
                    >
                        Remove Custodian
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}