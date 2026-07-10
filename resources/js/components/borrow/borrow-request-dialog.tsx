import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Asset {
    id: number;
    name: string;
    asset_tag: string;
}

interface Props {
    asset?: Asset;
    onOpenChange: (open: boolean) => void;
    onSubmit: (assetId: number, remarks: string) => void;
}

export function BorrowRequestDialog({ asset, onOpenChange, onSubmit }: Props) {
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        setRemarks('');
    }, [asset]);

    if (!asset) return null;

    return (
        <Dialog open={!!asset} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request to Borrow</DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-foreground">
                            {asset.name}
                        </span>{' '}
                        ({asset.asset_tag})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Reason / Remarks (optional)
                    </label>
                    <Textarea
                        rows={3}
                        placeholder="What will you use this for?"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit(asset.id, remarks)}>
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}