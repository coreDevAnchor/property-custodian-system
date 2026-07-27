import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CalendarDays, PackageOpen, PackageX, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LostConfirmDialog } from '@/components/dialog/lost-confirm-dialog';

interface BorrowedItem {
    id: number;
    requested_at: string;

    asset: {
        id: number;
        name: string;
        asset_tag: string;
        category: {
            id: number;
            name: string;
        };
    };
}

interface Props {
    open: boolean;
    items: BorrowedItem[];
    onOpenChange: (open: boolean) => void;
    reportAsLost?: boolean;
}

const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export function ReturnRequestDialog({ open, items, onOpenChange, reportAsLost = false }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [lostIds, setLostIds] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmLost, setShowConfirmLost] = useState(false);
    const [confirmNames, setConfirmNames] = useState('');
    const [pendingData, setPendingData] = useState<{ returnIds: number[]; lostSubmitIds: number[] } | null>(null);

    useEffect(() => {
        if (open) {
            const itemIds = items.map((item) => item.id);
            setSelectedIds(reportAsLost ? itemIds : []);
            setLostIds(reportAsLost ? itemIds : []);
        }
    }, [open, items, reportAsLost]);

    function toggleItem(id: number) {
        setSelectedIds((prev) => {
            const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];

            // Unchecking an item also clears its lost flag, since it's no
            // longer part of this submission.
            if (!next.includes(id)) {
                setLostIds((lost) => lost.filter((x) => x !== id));
            }

            return next;
        });
    }

    function toggleLost(id: number) {
        setLostIds((prev) => {
            const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];

            // Reporting something lost implies it's part of this submission,
            // even if the box wasn't checked yet.
            if (next.includes(id)) {
                setSelectedIds((sel) => (sel.includes(id) ? sel : [...sel, id]));
            }

            return next;
        });
    }

    function handleSubmit() {
        if (selectedIds.length === 0) return;

        const returnIds = selectedIds.filter((id) => !lostIds.includes(id));
        const lostSubmitIds = selectedIds.filter((id) => lostIds.includes(id));

        if (lostSubmitIds.length > 0) {
            const names = items
                .filter((item) => lostSubmitIds.includes(item.id))
                .map((item) => item.asset.name)
                .join(', ');

            setConfirmNames(names);
            setPendingData({ returnIds, lostSubmitIds });
            setShowConfirmLost(true);
            return;
        }

        executeSubmit(returnIds, lostSubmitIds);
    }

    function executeSubmit(returnIds: number[], lostSubmitIds: number[]) {
        setSubmitting(true);

        router.post(
            '/employee/returns',
            {
                borrow_ids: returnIds,
                lost_ids: lostSubmitIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setSubmitting(false),
            }
        );
    }

    const totalSelected = selectedIds.length;
    const lostCount = lostIds.filter((id) => selectedIds.includes(id)).length;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Process a Return</DialogTitle>
                    <DialogDescription>
                        Select the items you're returning today, or flag one as lost if you
                        can't physically return it.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Return date: <span className="font-medium text-foreground">{today}</span>
                </div>

                {items.length > 0 ? (
                    <div className="space-y-2">
                        {items.map((item) => {
                            const checked = selectedIds.includes(item.id);
                            const lost = lostIds.includes(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${lost
                                        ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
                                        : checked
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:bg-muted/50'
                                        }`}
                                >
                                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleItem(item.id)}
                                            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-orange-500"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {item.asset.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {item.asset.asset_tag} · {item.asset.category.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Borrowed since{' '}
                                                {new Date(item.requested_at).toLocaleDateString(
                                                    'en-US',
                                                    { year: 'numeric', month: 'short', day: 'numeric' }
                                                )}
                                            </p>
                                            {lost && (
                                                <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                                    Will be reported as lost
                                                </p>
                                            )}
                                        </div>
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => toggleLost(item.id)}
                                        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors cursor-pointer ${lost
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-600'
                                            }`}
                                        title={lost ? 'Undo lost report' : 'Report this item as lost'}
                                    >
                                        <PackageX className="size-3.5" />
                                        {lost ? 'Lost' : 'Report lost'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <PackageOpen className="size-8 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">
                            Nothing to return
                        </p>
                        <p className="text-xs text-muted-foreground">
                            You have no items currently borrowed.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="cursor-pointer"
                        onClick={handleSubmit}
                        disabled={totalSelected === 0 || submitting}
                    >
                        <Undo2 className="size-4" />
                        {submitting
                            ? 'Submitting…'
                            : `Submit ${totalSelected > 0 ? `(${totalSelected}${lostCount > 0 ? `, ${lostCount} lost` : ''})` : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <LostConfirmDialog
            open={showConfirmLost}
            onOpenChange={setShowConfirmLost}
            assetNames={confirmNames}
            title="Report Assets as Lost"
            description={`Are you sure you want to report "${confirmNames}" as lost? This notifies the custodian that these items cannot be physically returned.`}
            onConfirm={() => {
                if (pendingData) {
                    executeSubmit(pendingData.returnIds, pendingData.lostSubmitIds);
                }
                setShowConfirmLost(false);
            }}
        />
    </>
    );
}
