import { useState } from 'react';

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

    borrower: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    request: BorrowRequest | null;
    onClose: () => void;
    onConfirm: (message: string) => void;
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

export function BorrowRejectionDialog({ request, onClose, onConfirm }: Props) {
    const [message, setMessage] = useState('');

    if (!request) return null;

    return (
        <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                        <span>Reject Borrow Request</span>
                    </DialogTitle>
                    <DialogDescription>
                        Review the borrow request details and optionally provide a reason for rejecting the request.
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
                                    {request.borrower?.name ?? 'Unknown Employee'}
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
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                        Rejection Message <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>

                    <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Provide an optional reason for rejecting this request..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus:outline-none transition-shadow resize-none"
                    />

                    <p className="text-xs text-muted-foreground">
                        This message will be included in the notification sent to the borrower.
                    </p>
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
                        className="cursor-pointer bg-red-600 hover:bg-red-600/90 text-white dark:bg-red-500 dark:hover:bg-red-500/90"
                        onClick={() => onConfirm(message)}
                    >
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
