import { router, usePage } from '@inertiajs/react';
import { FileUp, FileSpreadsheet, FileDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';


import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!open) {
return;
}

        setServerError(errors?.file ?? null);
    }, [open, errors]);

    useEffect(() => {
        if (!open) {
            setFile(null);
            setServerError(null);
            setProcessing(false);

            if (inputRef.current) {
inputRef.current.value = '';
}
        }
    }, [open]);
    /* eslint-enable react-hooks/set-state-in-effect */

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!file) {
return;
}

        setServerError(null);
        setProcessing(true);

        router.post('/custodian/assets/import', { file }, {
            forceFormData: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors) => {
                setServerError(errors.file ?? 'Upload failed. Please try again.');
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Upload Assets from Excel</DialogTitle>
                    <DialogDescription>
                        Bulk-create assets from a spreadsheet. Tags are
                        generated automatically and continue the existing
                        numbering per asset type.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Column Requirements & Help */}
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
                                    <FileSpreadsheet className="size-3 text-muted-foreground shrink-0" />
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
                                    <FileSpreadsheet className="size-3 shrink-0" />
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

                    {/* File Uploader */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className={`flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border-2 border-dashed px-4 py-4 text-left transition-colors ${file
                                    ? 'border-primary/60 bg-primary/5'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <FileUp className="size-5 text-muted-foreground" />
                            </span>

                            <span className="min-w-0 flex-1">
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

                        {/* Template Downloads */}
                        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-foreground">
                                    Need a template?
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Download a sample spreadsheet to get started.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs bg-background hover:bg-muted font-medium cursor-pointer"
                                    asChild
                                >
                                    <a
                                        href="/custodian/assets/import/template?format=xlsx"
                                        download
                                        className={processing ? 'pointer-events-none opacity-50' : ''}
                                    >
                                        <FileDown className="mr-1 size-3.5" />
                                        Excel (.xlsx)
                                    </a>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs bg-background hover:bg-muted font-medium cursor-pointer"
                                    asChild
                                >
                                    <a
                                        href="/custodian/assets/import/template?format=csv"
                                        download
                                        className={processing ? 'pointer-events-none opacity-50' : ''}
                                    >
                                        <FileDown className="mr-1 size-3.5" />
                                        CSV (.csv)
                                    </a>
                                </Button>
                            </div>
                        </div>
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

                    {/* Footer Actions */}
                    <DialogFooter className="pt-2">
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