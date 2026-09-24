import { Download, Loader2 } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { exportMethod as exportReports } from '@/routes/custodian/reports';
import type { Category } from '@/types/categories';
import type { ReportView } from '@/types/reports';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories?: Category[];
    view: ReportView;
    category: string;
    sort: string;
}

type CsvSource = 'assets' | 'overdue' | 'lost';
type CsvSort = 'latest' | 'oldest' | 'name_asc' | 'name_desc' | 'cost_high' | 'cost_low';
type CsvLimit = 'all' | '10' | '50' | '100';

const CSV_SOURCES: { value: CsvSource; label: string }[] = [
    { value: 'assets', label: 'Asset' },
    { value: 'overdue', label: 'Overdue Items' },
    { value: 'lost', label: 'Lost Items' },
];

const CSV_SORTS: { value: CsvSort; label: string }[] = [
    { value: 'latest', label: 'Latest to Oldest' },
    { value: 'oldest', label: 'Oldest to Latest' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'cost_high', label: 'Highest Cost' },
    { value: 'cost_low', label: 'Lowest Cost' },
];

const CSV_LIMITS: { value: CsvLimit; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: '10', label: '10' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
];

const VALID_SORTS: string[] = CSV_SORTS.map((s) => s.value);

export function ExportCsvModal({ open, onOpenChange, categories = [], view, category, sort }: Props) {
    const [source, setSource] = useState<CsvSource>(
        view === 'overdue' || view === 'lost' ? view : 'assets'
    );
    const [categoryValue, setCategoryValue] = useState(category || 'all');
    const [sortValue, setSortValue] = useState<CsvSort>(
        VALID_SORTS.includes(sort) ? (sort as CsvSort) : 'latest'
    );
    const [limit, setLimit] = useState<CsvLimit>('all');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = () => {
        setIsDownloading(true);
        window.location.href = exportReports.url({
            query: {
                data_source: source,
                category: categoryValue,
                sort: sortValue,
                record_limit: limit,
            },
        });
        setTimeout(() => setIsDownloading(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-border bg-card">
                <DialogHeader className="space-y-1.5">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Export Custom CSV Report
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Choose which data to export, the category, the sort order, and how many records to include.
                    </DialogDescription>
                </DialogHeader>

                {/* Data Source */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">
                        Data Source
                    </h3>

                    <div className="grid grid-cols-3 gap-2">
                        {CSV_SOURCES.map((item) => (
                            <Button
                                key={item.value}
                                type="button"
                                variant={source === item.value ? 'default' : 'outline'}
                                className="w-full cursor-pointer"
                                onClick={() => setSource(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-5">
                    {/* Category */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">
                            Category
                        </h3>

                        <Select value={categoryValue} onValueChange={(value) => setCategoryValue(value)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">
                            Sort Order
                        </h3>

                        <Select value={sortValue} onValueChange={(value) => setSortValue(value as CsvSort)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {CSV_SORTS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Record limit */}
                <div className="space-y-2 border-t border-border pt-5">
                    <h3 className="text-sm font-semibold text-foreground">
                        Record Limit
                    </h3>

                    <div className="grid grid-cols-4 gap-2">
                        {CSV_LIMITS.map((item) => (
                            <Button
                                key={item.value}
                                type="button"
                                variant={limit === item.value ? 'default' : 'outline'}
                                className="w-full cursor-pointer"
                                onClick={() => setLimit(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Limit the number of rows the CSV will include.
                    </p>
                </div>

                <DialogFooter className="border-t border-border pt-4 sm:space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isDownloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}