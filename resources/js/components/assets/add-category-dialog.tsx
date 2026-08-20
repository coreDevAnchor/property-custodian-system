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
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function reset() {
        setName('');
        setPrefix('');
        setDescription('');
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
                    description: description.trim() || null,
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
                        <Input
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
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
