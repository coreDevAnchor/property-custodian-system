import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Asset } from '@/components/assets/types';
import { AlertTriangle } from 'lucide-react';

export function DeleteConfirmModal({
    asset,
    onCancel,
    onConfirm,
}: {
    asset: Asset | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={!!asset} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="size-5 text-red-500" />
                    </div>

                    <DialogTitle className="mt-4">
                        Delete this asset?
                    </DialogTitle>

                    <DialogDescription>
                        {asset && (
                            <>
                                <span className="font-semibold text-foreground">
                                    {asset.name}
                                </span>{' '}
                                ({asset.asset_tag}) will be permanently removed
                                from the inventory. This action cannot be
                                undone.
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
                        Delete Asset
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}