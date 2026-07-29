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
    lostReason?: string | null;
    title?: string;
}

export function LostConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    assetNames,
    lostReason,
    title = 'Confirm Asset as Lost',
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <PackageX className="size-5" />
                        {title}
                    </AlertDialogTitle>

                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <p>
                                The employee has reported{' '}
                                <span className="font-semibold text-foreground">
                                    {assetNames}
                                </span>{' '}
                                as lost.
                            </p>

                            <div className="rounded-lg border border-border bg-muted/50 p-4">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    Employee's Reason
                                </p>

                                <p className="text-sm leading-relaxed text-foreground">
                                    {lostReason?.trim()
                                        ? lostReason
                                        : 'No reason was provided.'}
                                </p>
                            </div>

                            <p>
                                Are you sure you want to confirm this asset as{' '}
                                <span className="font-semibold text-destructive">
                                    Lost
                                </span>
                                ? This will mark the asset as lost and close
                                the borrow request.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        Confirm Lost
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
