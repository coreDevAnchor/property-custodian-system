import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { FileUp, FileSpreadsheet } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

interface PageProps {
    errors: Record<string, string>;

    [key: string]: unknown;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const REQUIRED_COLUMNS = [
    'Name',
    'Asset-Tag',
    'Category',
    'Asset Type',
    'Acquisition Cost',
    'Total Depreciation',
];

const OPTIONAL_COLUMNS = ['Amount', 'Owner'];

export function ImportAssetsDialog({ open, onOpenChange }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { errors } = usePage<PageProps>().props;

    // Surface server-side rejections (bad headers / bad rows) sent through
    // the Inertia error bag after the redirect back.
    useEffect(() => {
        if (!open) return;

        setServerError(errors?.file ?? null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, errors]);

    useEffect(() => {
        if (!open) {
            setFile(null);
            setServerError(null);
            setProcessing(false);

            if (inputRef.current) inputRef.current.value = '';
        }
    }, [open]);

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!file) return;

        setServerError(null);
        setProcessing(true);

        router.post('/custodian/assets/import', { file }, {
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
            },
            onError: (errors) => {
                setServerError(errors.file ?? 'Upload failed. Please try again.');
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload Assets from Excel</DialogTitle>

                    <DialogDescription>
                        Bulk-create assets from a spreadsheet. Tags are
                        generated automatically and continue the existing
                        numbering per asset type.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                        <p className="font-semibold text-foreground">
                            Required columns:
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {REQUIRED_COLUMNS.map((column) => (
                                <span
                                    key={column}
                                    className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 font-medium text-foreground ring-1 ring-border"
                                >
                                    <FileSpreadsheet className="size-3 text-muted-foreground" />
                                    {column}
                                </span>
                            ))}
                        </div>

                        <p className="mt-2 font-semibold text-foreground">
                            Optional columns:
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            {OPTIONAL_COLUMNS.map((column) => (
                                <span
                                    key={column}
                                    className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 font-medium text-muted-foreground ring-1 ring-border"
                                >
                                    <FileSpreadsheet className="size-3" />
                                    {column}
                                </span>
                            ))}
                        </div>

                        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-muted-foreground">
                            <li>
                                Extra or missing columns are rejected — the
                                header row must match exactly.
                            </li>
                            <li>
                                Total Depreciation is a peso amount (cannot
                                exceed Acquisition Cost).
                            </li>
                            <li>
                                Unknown Category/Asset Type names are created
                                automatically; Owner must match an active
                                employee name.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 text-left transition-colors ${file ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <FileUp className="size-5 text-muted-foreground" />
                            </span>

                            <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-foreground">
                                    {file ? file.name : 'Choose .xlsx or .csv file'}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {file
                                        ? `${(file.size / 1024).toFixed(0)} KB — click to replace`
                                        : 'Max 5MB'}
                                </span>
                            </span>
                        </button>

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.csv"
                            className="hidden"
                            onChange={(event) => {
                                setFile(event.target.files?.[0] ?? null);
                                setServerError(null);
                            }}
                        />
                    </div>

                    {!file && !serverError && (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Select a spreadsheet to continue.
                        </p>
                    )}

                    {serverError && (
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                            <p className="whitespace-pre-line text-xs font-medium text-red-700 dark:text-red-400">
                                {serverError}
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            className="cursor-pointer"
                            disabled={!file || processing}
                        >
                            {processing ? 'Importing…' : 'Upload & Import'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
