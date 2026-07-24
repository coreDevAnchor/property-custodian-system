import { PackageX } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    assetNames: string;
    title?: string;
    description?: string;
}

export function LostConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    assetNames,
    title = 'Confirm Asset as Lost',
    description,
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <PackageX className="size-5" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || (
                            <>
                                Are you sure you want to mark{' '}
                                <span className="font-semibold text-foreground">
                                    "{assetNames}"
                                </span>{' '}
                                as lost? This action will write off the asset, update its status
                                to <span className="font-semibold text-destructive">Lost</span>,
                                and close the borrow request.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onConfirm}>
                        Confirm Lost
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
