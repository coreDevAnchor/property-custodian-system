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
import { Button } from '@/components/ui/button';
import { CalendarDays, PackageOpen, Undo2 } from 'lucide-react';

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
}

const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export function ReturnRequestDialog({ open, items, onOpenChange }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setSelectedIds([]);
    }, [open]);

    function toggleItem(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleSubmit() {
        if (selectedIds.length === 0) return;

        setSubmitting(true);

        router.post(
            '/employee/returns',
            { borrow_ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setSubmitting(false),
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Process a Return</DialogTitle>
                    <DialogDescription>
                        Select the items you're returning today.
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

                            return (
                                <label
                                    key={item.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${checked
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:bg-muted/50'
                                        }`}
                                >
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
                                    </div>
                                </label>
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedIds.length === 0 || submitting}
                    >
                        <Undo2 className="size-4" />
                        {submitting
                            ? 'Submitting…'
                            : `Return ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}