import { PackageOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface TakeAsset {
    id: number;
    name: string;
    asset_tag: string;
    amount?: number;
}

interface Props {
    asset?: TakeAsset;
    onOpenChange: (open: boolean) => void;
    onSubmit: (assetId: number, amount: number, remarks: string) => void;
}

export function TakeSupplyDialog({ asset, onOpenChange, onSubmit }: Props) {
    const [amount, setAmount] = useState(1);
    const [remarks, setRemarks] = useState('');

    const available = asset?.amount ?? 0;
    const amountInRange = amount >= 1 && amount <= available;

    function handleOpenChange(value: boolean) {
        if (!value) {
            setAmount(1);
            setRemarks('');
        }

        onOpenChange(value);
    }

    if (!asset) {
        return null;
    }

    return (
        <Dialog open={!!asset} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Take Supply</DialogTitle>

                    <DialogDescription>
                        <span className="font-semibold text-foreground">
                            {asset.name}
                        </span>{' '}
                        ({asset.asset_tag})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
                    <PackageOpen className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

                    <p className="text-xs text-foreground">
                        Consumable supply — taken directly, no approval needed,
                        and no return required. Stock is deducted immediately.
                    </p>
                </div>

                <div className="space-y-4 pt-1">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Quantity to Take
                        </label>

                        <input
                            type="number"
                            min="1"
                            max={available}
                            value={amount === 0 ? '' : amount}
                            onChange={(e) => {
                                if (e.target.value === '') {
                                    setAmount(0);

                                    return;
                                }

                                const next = Number(e.target.value);

                                if (!Number.isNaN(next)) {
                                    setAmount(next);
                                }
                            }}
                            placeholder="1"
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />

                        <p className="text-xs text-muted-foreground">
                            {available} unit(s) available in stock
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Remarks
                        </label>

                        <Textarea
                            rows={3}
                            maxLength={1000}
                            placeholder="Optional — purpose or note"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />

                        <p className="text-xs text-muted-foreground">
                            {remarks.length}/1000
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600"
                        disabled={!amountInRange}
                        onClick={() =>
                            onSubmit(
                                asset.id,
                                amount,
                                remarks.trim(),
                            )
                        }
                    >
                        Take Supply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}