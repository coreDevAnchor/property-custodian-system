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
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarClock, CalendarDays } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    borrowId: number;
    currentDueDate: string;
    assetName: string;
    assetTag: string;
    onSubmit: (
        borrowId: number,
        requestedDueDate: string,
        reason: string
    ) => void;
}

function formatDate(value?: string | null) {
    if (!value) return '—';

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

export function BorrowRenewalDialog({
    open,
    onOpenChange,
    borrowId,
    currentDueDate,
    assetName,
    assetTag,
    onSubmit,
}: Props) {
    const [requestedDueDate, setRequestedDueDate] = useState('');
    const [reason, setReason] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setRequestedDueDate('');
            setReason('');
            setCalendarOpen(false);
        }
    }, [open]);

    const currentDueDateObject = new Date(currentDueDate);

    const selectedDate = requestedDueDate
        ? new Date(`${requestedDueDate}T00:00:00`)
        : undefined;

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        // Convert Date to YYYY-MM-DD
        const formattedDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
        ].join('-');

        setRequestedDueDate(formattedDate);
        setCalendarOpen(false);
    };

    const handleSubmit = () => {
        if (!requestedDueDate || !reason.trim()) {
            return;
        }

        onSubmit(
            borrowId,
            requestedDueDate,
            reason.trim()
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="size-5" />
                        Request Due Date Extension
                    </DialogTitle>

                    <DialogDescription>
                        Request a longer borrowing period for{' '}
                        <span className="font-semibold text-foreground">
                            {assetName}
                        </span>{' '}
                        ({assetTag}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current due date */}
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Current Due Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDate(currentDueDate)}
                        </p>
                    </div>

                    {/* Requested due date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Requested New Due Date
                        </label>

                        <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 w-full cursor-pointer justify-start text-left font-normal"
                                >
                                    <CalendarDays className="mr-2 size-4 text-muted-foreground" />

                                    {selectedDate ? (
                                        formatDate(requestedDueDate)
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Select a new due date
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    disabled={{
                                        before: currentDueDateObject,
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        <p className="text-xs text-muted-foreground">
                            The requested date must be later than your current
                            due date.
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Reason for Extension
                        </label>

                        <Textarea
                            rows={4}
                            placeholder="Explain why you need more time to return this asset..."
                            value={reason}
                            onChange={(e) =>
                                setReason(e.target.value)
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        className="cursor-pointer"
                        disabled={
                            !requestedDueDate ||
                            !reason.trim()
                        }
                        onClick={handleSubmit}
                    >
                        Submit Renewal Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}