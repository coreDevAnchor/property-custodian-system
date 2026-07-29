import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PackageX } from 'lucide-react';
import { useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    borrowId: number;
    assetName: string;
    assetTag: string;
    submitting?: boolean;
    onSubmit: (borrowId: number, reason: string) => void;
}

export function LostAssetDialog({
    open,
    onOpenChange,
    borrowId,
    assetName,
    assetTag,
    submitting = false,
    onSubmit,
}: Props) {
    const [reason, setReason] = useState('');

    function handleSubmit() {
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            return;
        }

        onSubmit(borrowId, trimmedReason);
    }

    function handleOpenChange(value: boolean) {
        if (!value && !submitting) {
            setReason('');
        }

        onOpenChange(value);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-red-500/10">
                        <PackageX className="size-5 text-red-600 dark:text-red-400" />
                    </div>

                    <DialogTitle>Report Asset as Lost</DialogTitle>

                    <DialogDescription>
                        Please provide a reason explaining why this asset
                        was lost. Your report will be sent to the custodian
                        for review.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-foreground">
                            {assetName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Asset Tag: {assetTag}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor={`lost-reason-${borrowId}`}
                            className="text-sm font-semibold text-foreground"
                        >
                            Reason for Loss
                        </label>

                        <textarea
                            id={`lost-reason-${borrowId}`}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Explain how or why the asset was lost..."
                            rows={5}
                            maxLength={1000}
                            disabled={submitting}
                            className="flex w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <div className="flex justify-between">
                            <p className="text-xs text-muted-foreground">
                                Please provide enough details for the custodian
                                to review your report.
                            </p>

                            <span className="text-xs text-muted-foreground">
                                {reason.length}/1000
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                        Once submitted, the custodian will be notified and
                        will review your lost asset report.
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={handleSubmit}
                        disabled={!reason.trim() || submitting}
                    >
                        <PackageX className="size-4" />
                        {submitting
                            ? 'Submitting…'
                            : 'Submit Lost Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
