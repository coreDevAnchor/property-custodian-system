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
import type { AssetType } from '@/types/assets';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryId: number;
    onCreated: (assetType: AssetType) => void;
}

export function AddAssetTypeDialog({ open, onOpenChange, categoryId, onCreated }: Props) {
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
            const response = await fetch('/custodian/asset-types', {
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
                    category_id: categoryId,
                    description: description.trim() || null,
                }),
            });

            if (!response.ok) {
                const errors = await response.json();
                throw new Error(errors.message || 'Failed to create asset type.');
            }

            const assetType = await response.json();
            onCreated(assetType);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create asset type.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => v ? onOpenChange(v) : handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Asset Type</DialogTitle>
                        <DialogDescription>
                            Create a new asset type under the selected category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="Asset Type Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            placeholder="Prefix (e.g. PEN)"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                        />
                        {/* <Input
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )} */}
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
                title="Create Asset Type"
                description={`Create asset type "${name.trim()}" with prefix "${prefix.trim().toUpperCase()}"?`}
                confirmLabel="Create"
                onConfirm={handleCreate}
                loading={loading}
            />
        </>
    );
}
