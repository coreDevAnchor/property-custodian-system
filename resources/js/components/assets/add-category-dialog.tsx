import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Category } from '@/types/categories';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (category: Category) => void;
}

export function AddCategoryDialog({ open, onOpenChange, onCreated }: Props) {
    const [name, setName] = useState('');
    const [prefix, setPrefix] = useState('');
    const [unitType, setUnitType] = useState<'single' | 'multi'>('single');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function reset() {
        setName('');
        setPrefix('');
        setUnitType('single');
        setError(null);
        setLoading(false);
        setConfirmOpen(false);
    }

    function handleClose() {
        reset();
        onOpenChange(false);
    }

    async function handleCreate() {
        if (!name.trim() || !prefix.trim()) {
            setError('Name and prefix are required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/custodian/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
                    ),
                },
                body: JSON.stringify({
                    name: name.trim(),
                    prefix: prefix.trim().toUpperCase(),
                    unit_type: unitType,
                }),
            });

            if (!response.ok) {
                const errors = await response.json();
                throw new Error(errors.message || 'Failed to create category.');
            }

            const category = await response.json();
            onCreated(category);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create category.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => v ? onOpenChange(v) : handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                            Create a new asset category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="Category Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            placeholder="Prefix (e.g. OFFSUP)"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                        />
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-foreground">
                                Unit Type
                            </p>
                            <div className="flex w-full overflow-hidden rounded-lg border border-border">
                                {([
                                    { value: 'single', label: 'Single-Unit' },
                                    { value: 'multi', label: 'Multi-Unit' },
                                ] as const).map((option, index) => {
                                    const isActive = unitType === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setUnitType(option.value)}
                                            className={`flex-1 cursor-pointer border-border px-3 py-2 text-sm font-semibold transition-colors ${index !== 0 ? 'border-l' : ''} ${
                                                isActive
                                                    ? 'bg-orange-500 text-white border-orange-500'
                                                    : 'bg-background text-muted-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Multi-unit categories track stock quantity (e.g. consumable supplies).
                            </p>
                        </div>
                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button onClick={() => setConfirmOpen(true)}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Create Category"
                description={`Create category "${name.trim()}" with prefix "${prefix.trim().toUpperCase()}"?`}
                confirmLabel="Create"
                onConfirm={handleCreate}
                loading={loading}
            />
        </>
    );
}
