import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, FileText, Package, User } from 'lucide-react';

interface BorrowRequest {
    id: number;
    requested_at: string;
    remarks?: string | null;
    expected_return_date?: string | null;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: {
            id: number;
            name: string;
        };
    };

    employee: {
        id: number;
        user: {
            name: string;
        };
    };
}

interface Props {
    request: BorrowRequest | null;
    onClose: () => void;
    onConfirm: (expectedReturnDate: string) => void;
}

function formatDate(value?: string | null) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function BorrowApprovalDialog({ request, onClose, onConfirm }: Props) {
    const [expectedReturnDate, setExpectedReturnDate] = useState('');

    useEffect(() => {
        if (request) {
            // Laravel may return the date as a full ISO string (e.g. "2026-07-20T00:00:00.000000Z").
            // The <input type="date"> requires strictly "YYYY-MM-DD", so we normalize it.
            const raw = request.expected_return_date;
            const normalized = raw ? raw.split('T')[0] : '';
            setExpectedReturnDate(normalized);
        }
    }, [request]);

    if (!request) return null;

    return (
        <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                        <span>Approve Borrow Request</span>
                    </DialogTitle>
                    <DialogDescription>
                        Review the borrow request details and adjust the expected return date if needed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* ── Asset Card ── */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 flex gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                            <Package className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Asset Information
                            </p>
                            <h4 className="text-base font-semibold text-foreground truncate mt-0.5">
                                {request.asset.name}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                                Tag: <span className="font-mono text-xs font-semibold bg-muted px-1.5 py-0.5 rounded border border-border">{request.asset.asset_tag}</span> · {request.asset.category.name}
                            </p>
                        </div>
                    </div>

                    {/* ── Requester & Request details ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Requester */}
                        <div className="flex items-start gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                                <User className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Requested By
                                </p>
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {request.employee.user.name}
                                </p>
                            </div>
                        </div>

                        {/* Request Date */}
                        <div className="flex items-start gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                                <CalendarDays className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Request Date
                                </p>
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {formatDate(request.requested_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Employee Remarks */}
                    {request.remarks && (
                        <div className="flex gap-2.5 rounded-lg border border-border/80 bg-background/50 p-3 text-sm text-muted-foreground">
                            <FileText className="size-4 shrink-0 text-muted-foreground/75 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Employee Remarks
                                </p>
                                <p className="italic mt-0.5 leading-relaxed text-xs">
                                    &ldquo;{request.remarks}&rdquo;
                                </p>
                            </div>
                        </div>
                    )}

                    <hr className="border-border/60" />

                    {/* Expected Return Date Picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">
                            Expected Return Date
                        </label>
                        <input
                            type="date"
                            value={expectedReturnDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus:outline-none transition-shadow"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            You can modify the date that was originally set by the employee.
                        </p>
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-600/90 text-white dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                        onClick={() => onConfirm(expectedReturnDate)}
                        disabled={!expectedReturnDate}
                    >
                        Confirm Approval
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
