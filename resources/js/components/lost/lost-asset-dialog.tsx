import { PackageX } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    borrowId: number;
    assetName: string;
    assetTag: string;
    submitting?: boolean;
    error?: string | null;
    onSubmit: (borrowId: number, reason: string) => void;
}

const MIN_REASON_LENGTH = 10; // must match backend validation rule

export function LostAssetDialog({
    open,
    onOpenChange,
    borrowId,
    assetName,
    assetTag,
    submitting = false,
    error = null,
    onSubmit,
}: Props) {
    const [reason, setReason] = useState('');
    const [touched, setTouched] = useState(false);

    const trimmedLength = reason.trim().length;
    const isTooShort = trimmedLength > 0 && trimmedLength < MIN_REASON_LENGTH;

    const clientError = touched && trimmedLength === 0
        ? 'Please provide a reason.'
        : touched && isTooShort
            ? `Please enter at least ${MIN_REASON_LENGTH} characters (currently ${trimmedLength}).`
            : null;

    const displayedError = clientError ?? error;

    function handleSubmit() {
        setTouched(true);

        const trimmedReason = reason.trim();

        if (trimmedReason.length < MIN_REASON_LENGTH) {
            return;
        }

        onSubmit(borrowId, trimmedReason);
    }

    function handleOpenChange(value: boolean) {
        if (!value && !submitting) {
            setReason('');
            setTouched(false);
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
                            onBlur={() => setTouched(true)}
                            placeholder="Explain how or why the asset was lost..."
                            rows={5}
                            maxLength={1000}
                            disabled={submitting}
                            aria-invalid={!!displayedError}
                            aria-describedby={`lost-reason-hint-${borrowId}`}
                            className={`flex w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${displayedError
                                    ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/50'
                                    : 'border-input focus-visible:border-ring focus-visible:ring-ring/50'
                                }`}
                        />

                        <div className="flex items-start justify-between gap-3">
                            <p
                                id={`lost-reason-hint-${borrowId}`}
                                className={`text-xs ${displayedError
                                        ? 'font-medium text-red-600 dark:text-red-400'
                                        : 'text-muted-foreground'
                                    }`}
                            >
                                {displayedError ??
                                    `Please provide at least ${MIN_REASON_LENGTH} characters so the custodian can review your report.`}
                            </p>

                            <span className="shrink-0 text-xs text-muted-foreground">
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
                        disabled={trimmedLength < MIN_REASON_LENGTH || submitting}
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