import { router } from '@inertiajs/react';
import { ArrowLeft, FileDown, FileSpreadsheet, FileUp } from 'lucide-react';
import { useRef, useState } from 'react';

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
    kind: 'employees' | 'custodians';
    onOpenChange: (open: boolean) => void;
}

const CONFIG = {
    employees: {
        title: 'Import Employees from Excel',
        previewTitle: 'Review Employee Import',
        plural: 'Employees',
        columns: ['Full Name', 'Email', 'Department', 'Contact Number'],
        departments: [
            'IT Department',
            'Human Resources',
            'Finance',
            'Accounting',
            'Administration',
            'Procurement',
            'Maintenance',
        ],
        baseUrl: '/custodian/employees/import',
        tableHeaders: ['Full Name', 'Email', 'Department', 'Contact Number'],
    },
    custodians: {
        title: 'Import Custodians from Excel',
        previewTitle: 'Review Custodian Import',
        plural: 'Custodians',
        columns: ['Full Name', 'Email'],
        departments: [],
        baseUrl: '/custodian/custodians/import',
        tableHeaders: ['Full Name', 'Email'],
    },
} as const;

interface PreviewRow {
    row: number;
    name: string;
    email: string;
    department?: string;
    contact?: string;
    status: 'new';
}

interface Preview {
    summary: { total: number };
    rows: PreviewRow[];
}

async function postJson(url: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    let token: string | undefined;

    for (const cookie of document.cookie.split('; ')) {
        if (cookie.startsWith('XSRF-TOKEN=')) {
            token = decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
            break;
        }
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        },
        body: formData,
    });

    const body = await response.json().catch(() => ({}));

    return { ok: response.ok, body };
}

function NewBadge() {
    return (
        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary lowercase ring-1 ring-primary/20">
            New
        </span>
    );
}

export function ImportPeopleDialog({ open, kind, onOpenChange }: Props) {
    const config = CONFIG[kind];
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'choose' | 'preview'>('choose');
    const [processing, setProcessing] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);

    async function handlePreview(event: React.FormEvent) {
        event.preventDefault();

        if (!file) {
            return;
        }

        setServerError(null);
        setProcessing(true);

        try {
            const { ok, body } = await postJson(
                `${config.baseUrl}/preview`,
                file,
            );

            if (!ok) {
                setServerError(
                    body?.message ??
                        'Could not preview the file. Please try again.',
                );
                setStep('choose');
            } else {
                setPreview(body as Preview);
                setStep('preview');
            }
        } catch {
            setServerError('Could not preview the file. Please try again.');
            setStep('choose');
        } finally {
            setProcessing(false);
        }
    }

    function handleImport(event: React.FormEvent) {
        event.preventDefault();

        if (!file) {
            return;
        }

        setServerError(null);
        setProcessing(true);

        router.post(
            config.baseUrl,
            { file },
            {
                forceFormData: true,
                onSuccess: () => onOpenChange(false),
                onError: (importErrors) => {
                    setServerError(
                        importErrors.file ?? 'Upload failed. Please try again.',
                    );
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    function goBackToChoose() {
        setStep('choose');
        setPreview(null);
        setServerError(null);
    }

    const visibleRows = preview?.rows.slice(0, 100) ?? [];

    function handleOpenChange(next: boolean) {
        if (!next) {
            setFile(null);
            setStep('choose');
            setPreview(null);
            setServerError(null);
            setProcessing(false);

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }

        onOpenChange(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'preview'
                            ? config.previewTitle
                            : config.title}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'preview' ? (
                            <>
                                Verify the import below, then confirm to create{' '}
                                {preview?.summary.total ?? 0} {config.plural}.
                            </>
                        ) : (
                            `Bulk-create ${kind} accounts from a spreadsheet. Brand-new accounts use the default password Password123!.`
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={step === 'preview' ? handleImport : handlePreview}
                    className="space-y-4"
                >
                    {step === 'preview' && preview ? (
                        <>
                            {/* Summary chips */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-baseline gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-xs ring-1 ring-border">
                                    <span className="font-bold text-foreground">
                                        {preview.summary.total}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {config.plural} to create
                                    </span>
                                </span>
                            </div>

                            {/* Row table */}
                            <div className="max-h-72 overflow-auto rounded-lg border border-border bg-background">
                                <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                                    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                                        <tr className="text-muted-foreground">
                                            <th className="px-3 py-2 font-semibold">
                                                #
                                            </th>
                                            {config.tableHeaders.map(
                                                (header) => (
                                                    <th
                                                        key={header}
                                                        className="px-3 py-2 font-semibold"
                                                    >
                                                        {header}
                                                    </th>
                                                ),
                                            )}
                                            <th className="px-3 py-2 font-semibold">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {visibleRows.map((row) => (
                                            <tr
                                                key={row.row}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {row.row}
                                                </td>
                                                <td className="px-3 py-2 font-medium text-foreground">
                                                    {row.name}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {row.email}
                                                </td>
                                                {kind === 'employees' && (
                                                    <>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {row.department}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {row.contact}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-3 py-2">
                                                    <NewBadge />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {preview.rows.length > 100 && (
                                <p className="text-xs text-muted-foreground">
                                    Showing the first 100 of {preview.rows.length}{' '}
                                    rows.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Column Requirements & Help */}
                            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                                <p className="font-semibold text-foreground">
                                    Required columns:
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {config.columns.map((column) => (
                                        <span
                                            key={column}
                                            className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 font-medium text-foreground ring-1 ring-border"
                                        >
                                            <FileSpreadsheet className="size-3 shrink-0 text-muted-foreground" />
                                            {column}
                                        </span>
                                    ))}
                                </div>

                                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-muted-foreground">
                                    <li>
                                        Extra or missing columns are rejected —
                                        the header row must match exactly.
                                    </li>
                                    {kind === 'employees' ? (
                                        <>
                                            <li>
                                                Department must be one of:{' '}
                                                {config.departments.join(', ')}.
                                            </li>
                                            <li>
                                                Contact Number must be 11 digits
                                                and start with 09 (e.g.{' '}
                                                09171234567).
                                            </li>
                                        </>
                                    ) : null}
                                    <li>
                                        Emails must be valid and unique — files
                                        containing duplicates or emails already
                                        in use are rejected.
                                    </li>
                                    <li>
                                        New accounts use the default password{' '}
                                        <span className="font-semibold text-foreground">
                                            Password123!
                                        </span>
                                        .
                                    </li>
                                </ul>
                            </div>

                            {/* File Uploader */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className={`flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border-2 border-dashed px-4 py-4 text-left transition-colors ${
                                        file
                                            ? 'border-primary/60 bg-primary/5'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <FileUp className="size-5 text-muted-foreground" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-foreground">
                                            {file
                                                ? file.name
                                                : 'Choose .xlsx or .csv file'}
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
                                        setFile(
                                            event.target.files?.[0] ?? null,
                                        );
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
                                            Download a sample spreadsheet to get
                                            started.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 cursor-pointer bg-background text-xs font-medium hover:bg-muted"
                                            asChild
                                        >
                                            <a
                                                href={`${config.baseUrl}/template?format=xlsx`}
                                                download
                                                className={
                                                    processing
                                                        ? 'pointer-events-none opacity-50'
                                                        : ''
                                                }
                                            >
                                                <FileDown className="mr-1 size-3.5" />
                                                Excel (.xlsx)
                                            </a>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 cursor-pointer bg-background text-xs font-medium hover:bg-muted"
                                            asChild
                                        >
                                            <a
                                                href={`${config.baseUrl}/template?format=csv`}
                                                download
                                                className={
                                                    processing
                                                        ? 'pointer-events-none opacity-50'
                                                        : ''
                                                }
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
                        </>
                    )}

                    {serverError && (
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                            <p className="text-xs font-medium whitespace-pre-line text-red-700 dark:text-red-400">
                                {serverError}
                            </p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <DialogFooter className="gap-2 pt-2">
                        {step === 'preview' && (
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={goBackToChoose}
                                disabled={processing}
                            >
                                <ArrowLeft className="mr-1 size-3.5" />
                                Back
                            </Button>
                        )}

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
                            disabled={
                                !file ||
                                processing ||
                                (step === 'preview' && !preview)
                            }
                        >
                            {processing
                                ? step === 'preview'
                                    ? 'Importing…'
                                    : 'Previewing…'
                                : step === 'preview'
                                  ? `Import ${preview?.summary.total ?? ''} ${config.plural}`
                                  : 'Preview File'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}