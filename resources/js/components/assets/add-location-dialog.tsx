import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Location } from '@/types/location';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (location: Location) => void;
}

export function AddLocationDialog({ open, onOpenChange, onCreated }: Props) {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function reset() {
        setName('');
        setError(null);
        setLoading(false);
        setConfirmOpen(false);
    }

    function handleClose() {
        reset();
        onOpenChange(false);
    }

    async function handleCreate() {
        if (!name.trim()) {
            setError('Location name is required.');

            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/custodian/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                body: JSON.stringify({ name: name.trim() }),
            });

            if (!response.ok) {
                const errors = await response.json();

                throw new Error(errors.message || 'Failed to create location.');
            }

            const location = await response.json();
            onCreated(location);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create location.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Location</DialogTitle>
                        <DialogDescription>
                            Create a new asset location.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="Location Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={() => setConfirmOpen(true)}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Create Location"
                description={`Create location "${name.trim()}"?`}
                confirmLabel="Create"
                onConfirm={handleCreate}
                loading={loading}
            />
        </>
    );
}
