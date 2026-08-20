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
import {
    CalendarDays,
    ImageOff,
    MapPin,
    ShieldCheck,
} from 'lucide-react';
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
    amount?: number;

    category?: {
        id: number;
        name: string;
    } | null;

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
        remarks: string,
        borrowAmount?: number,
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

const MIN_REMARKS_LENGTH = 10;

function ConditionBadge({
    condition,
}: {
    condition?: number | null;
}) {
    if (!condition || !conditionLabels[condition]) {
        return (
            <span className="text-sm text-muted-foreground">
                —
            </span>
        );
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
        <div className="flex min-w-0 items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="size-3.5 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>

                <div className="break-words text-sm font-medium text-foreground">
                    {value ?? (
                        <span className="text-muted-foreground">
                            —
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatDate(value?: string | null) {
    if (!value) return undefined;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function BorrowRequestDialog({
    asset,
    onOpenChange,
    onSubmit,
}: Props) {
    const [remarks, setRemarks] = useState('');
    const [expectedReturnDate, setExpectedReturnDate] = useState('');
    const [borrowAmount, setBorrowAmount] = useState(1);
    const [touched, setTouched] = useState(false);

    const isOfficeSupplies =
        asset?.category?.name === 'Office Supplies';

    const trimmedLength = remarks.trim().length;

    const isRemarksTooShort =
        trimmedLength > 0 &&
        trimmedLength < MIN_REMARKS_LENGTH;

    const remarksError =
        touched && trimmedLength === 0
            ? 'Please provide a reason.'
            : touched && isRemarksTooShort
                ? `Please enter at least ${MIN_REMARKS_LENGTH} characters (currently ${trimmedLength}).`
                : null;

    const canSubmit =
        !!expectedReturnDate &&
        trimmedLength >= MIN_REMARKS_LENGTH &&
        (!isOfficeSupplies ||
            (borrowAmount >= 1 &&
                borrowAmount <= (asset?.amount ?? 1)));

    useEffect(() => {
        setRemarks('');
        setExpectedReturnDate('');
        setBorrowAmount(1);
        setTouched(false);
    }, [asset]);

    function handleOpenChange(value: boolean) {
        if (!value) {
            setRemarks('');
            setExpectedReturnDate('');
            setBorrowAmount(1);
            setTouched(false);
        }

        onOpenChange(value);
    }

    if (!asset) {
        return null;
    }

    return (
        <Dialog
            open={!!asset}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        Request to Borrow
                    </DialogTitle>

                    <DialogDescription>
                        <span className="font-semibold text-foreground">
                            {asset.name}
                        </span>{' '}
                        ({asset.asset_tag})
                    </DialogDescription>
                </DialogHeader>

                {/* ── Photo ── */}
                <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30 sm:h-72">
                    {asset.photo ? (
                        <img
                            src={`/storage/${asset.photo}`}
                            alt={asset.name}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImageOff className="size-6" />

                            <span className="text-xs font-medium">
                                No photo available
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Details / Form Content ── */}
                <div className="relative z-10 space-y-4 bg-background pt-1">
                    {/* ── Description ── */}
                    {asset.description && (
                        <p className="break-words text-sm text-muted-foreground">
                            {asset.description}
                        </p>
                    )}

                    {/* ── Details grid ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <DetailRow
                            icon={CalendarDays}
                            label="Acquired"
                            value={formatDate(
                                asset.acquisition_date,
                            )}
                        />

                        <DetailRow
                            icon={ShieldCheck}
                            label="Condition"
                            value={
                                <ConditionBadge
                                    condition={asset.condition}
                                />
                            }
                        />

                        <DetailRow
                            icon={MapPin}
                            label="Location"
                            value={asset.location?.name}
                        />
                    </div>

                    {/* ── Quantity ── */}
                    {isOfficeSupplies && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Quantity to Borrow
                            </label>

                            <input
                                type="number"
                                min="1"
                                max={asset.amount ?? 1}
                                value={borrowAmount}
                                onChange={(e) =>
                                    setBorrowAmount(
                                        Number(e.target.value),
                                    )
                                }
                                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />

                            <p className="text-xs text-muted-foreground">
                                {asset.amount ?? 0} units available
                            </p>
                        </div>
                    )}

                    {/* ── Expected Return Date ── */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Expected Return Date
                        </label>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={`h-10 w-full cursor-pointer justify-start text-left font-normal ${!expectedReturnDate
                                            ? 'text-muted-foreground'
                                            : ''
                                        }`}
                                >
                                    <CalendarDays className="mr-2 size-4" />

                                    {expectedReturnDate
                                        ? new Date(
                                            `${expectedReturnDate}T00:00:00`,
                                        ).toLocaleDateString(
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

                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={
                                        expectedReturnDate
                                            ? new Date(
                                                `${expectedReturnDate}T00:00:00`,
                                            )
                                            : undefined
                                    }
                                    disabled={(date) =>
                                        date <
                                        new Date(
                                            new Date().setHours(
                                                0,
                                                0,
                                                0,
                                                0,
                                            ),
                                        )
                                    }
                                    onSelect={(date) => {
                                        if (!date) {
                                            setExpectedReturnDate(
                                                '',
                                            );
                                            return;
                                        }

                                        const formattedDate = [
                                            date.getFullYear(),
                                            String(
                                                date.getMonth() + 1,
                                            ).padStart(2, '0'),
                                            String(
                                                date.getDate(),
                                            ).padStart(2, '0'),
                                        ].join('-');

                                        setExpectedReturnDate(
                                            formattedDate,
                                        );
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* ── Reason / Remarks ── */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Reason / Remarks
                        </label>

                        <Textarea
                            rows={3}
                            maxLength={1000}
                            placeholder="What will you use this for?"
                            value={remarks}
                            onChange={(e) =>
                                setRemarks(e.target.value)
                            }
                            onBlur={() => setTouched(true)}
                            aria-invalid={!!remarksError}
                            className={
                                remarksError
                                    ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/50'
                                    : ''
                            }
                        />

                        <div className="flex items-start justify-between gap-3">
                            <p
                                className={`text-xs ${remarksError
                                        ? 'font-medium text-red-600 dark:text-red-400'
                                        : 'text-muted-foreground'
                                    }`}
                            >
                                {remarksError ??
                                    `Please enter at least ${MIN_REMARKS_LENGTH} characters explaining your purpose.`}
                            </p>

                            <span className="shrink-0 text-xs text-muted-foreground">
                                {remarks.length}/1000
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <DialogFooter>
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() =>
                            handleOpenChange(false)
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        className="cursor-pointer"
                        disabled={!canSubmit}
                        onClick={() => {
                            setTouched(true);

                            if (!canSubmit) {
                                return;
                            }

                            onSubmit(
                                asset.id,
                                expectedReturnDate,
                                remarks.trim(),
                                isOfficeSupplies
                                    ? borrowAmount
                                    : undefined,
                            );
                        }}
                    >
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}