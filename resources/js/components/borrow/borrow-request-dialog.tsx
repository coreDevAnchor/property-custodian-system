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
import { CalendarDays, ImageOff, MapPin, ShieldCheck } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Asset {
    id: number;
    name: string;
    asset_tag: string;
    description?: string | null;
    photo?: string | null;
    acquisition_date?: string | null;
    condition?: number | null;

    location?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    asset?: Asset;
    onOpenChange: (open: boolean) => void;
    onSubmit: (
        assetId: number,
        expectedReturnDate: string,
        remarks: string
    ) => void;
}

const conditionLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Excellent',
};

const conditionStyles: Record<number, string> = {
    1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    3: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function ConditionBadge({ condition }: { condition?: number | null }) {
    if (!condition || !conditionLabels[condition]) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${conditionStyles[condition]}`}
        >
            {conditionLabels[condition]}
        </span>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <div className="text-sm font-medium text-foreground">
                    {value ?? <span className="text-muted-foreground">—</span>}
                </div>
            </div>
        </div>
    );
}

function formatDate(value?: string | null) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function BorrowRequestDialog({ asset, onOpenChange, onSubmit }: Props) {
    const [remarks, setRemarks] = useState('');
    const [expectedReturnDate, setExpectedReturnDate] = useState('');

    useEffect(() => {
        setRemarks('');
        setExpectedReturnDate('');
    }, [asset]);

    if (!asset) return null;

    return (
        <Dialog open={!!asset} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Request to Borrow</DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-foreground">
                            {asset.name}
                        </span>{' '}
                        ({asset.asset_tag})
                    </DialogDescription>
                </DialogHeader>

                {/* ── Photo ── */}
                <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                    {asset.photo ? (
                        <img
                            src={`/storage/${asset.photo}`}
                            alt={asset.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageOff className="size-6" />
                            <span className="text-xs font-medium">No photo available</span>
                        </div>
                    )}
                </div>

                {/* ── Description ── */}
                {asset.description && (
                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                )}

                {/* ── Details grid ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <DetailRow
                        icon={CalendarDays}
                        label="Acquired"
                        value={formatDate(asset.acquisition_date)}
                    />
                    <DetailRow
                        icon={ShieldCheck}
                        label="Condition"
                        value={<ConditionBadge condition={asset.condition} />}
                    />
                    <DetailRow
                        icon={MapPin}
                        label="Location"
                        value={asset.location?.name}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Expected Return Date
                    </label>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={`h-10 w-full cursor-pointer justify-start text-left font-normal ${
                                    !expectedReturnDate
                                        ? 'text-muted-foreground'
                                        : ''
                                }`}
                            >
                                <CalendarDays className="mr-2 size-4" />
                                {expectedReturnDate
                                    ? new Date(`${expectedReturnDate}T00:00:00`).toLocaleDateString(
                                          'en-US',
                                          {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric',
                                          },
                                      )
                                    : 'Select expected return date'}
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={
                                    expectedReturnDate
                                        ? new Date(`${expectedReturnDate}T00:00:00`)
                                        : undefined
                                }
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                onSelect={(date) => {
                                    if (!date) {
                                        setExpectedReturnDate('');
                                        return;
                                    }

                                    const formattedDate = [
                                        date.getFullYear(),
                                        String(date.getMonth() + 1).padStart(2, '0'),
                                        String(date.getDate()).padStart(2, '0'),
                                    ].join('-');

                                    setExpectedReturnDate(formattedDate);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

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
                    <Button
                        className='cursor-pointer'
                        variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className='cursor-pointer'
                        onClick={() =>
                                onSubmit(asset.id, expectedReturnDate, remarks)
                            }
                        >
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}