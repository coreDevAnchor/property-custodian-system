import { Eye, FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { exportPdf } from '@/routes/custodian/reports';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: {
        category: string;
        sort: string;
        headerPeriod: string;
        chartPeriod: string;
        employeePeriod: string;
        usageMetric: string;
    };
}

const REPORT_SECTIONS = [
    { id: 'summary', label: 'Executive Summary & KPIs', description: 'Total assets, values, conditions, and depreciations' },
    { id: 'usage_chart', label: 'Monthly Usage Statistics', description: 'Table breakdown of borrows and asset additions over time' },
    { id: 'assets', label: 'Asset Inventory List', description: 'List of assets, tags, costs, and depreciation rates' },
    { id: 'overdue', label: 'Overdue Items List', description: 'Active borrows past their expected return date' },
    { id: 'lost', label: 'Lost Assets List', description: 'Inventory items currently flagged as lost' },
    { id: 'borrowers', label: 'Borrower Analytics', description: 'Top borrow/return and on-time return statistics' },
] as const;

type SectionId = typeof REPORT_SECTIONS[number]['id'];

export function ExportPdfModal({ open, onOpenChange, filters }: Props) {
    const [sections, setSections] = useState<SectionId[]>([
        'summary',
        'usage_chart',
        'assets',
        'overdue',
        'lost',
        'borrowers',
    ]);
    const [limitType, setLimitType] = useState<'all' | '10' | '50' | '100' | 'custom'>('all');
    const [customLimit, setCustomLimit] = useState<string>('200');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const handleSectionToggle = (id: SectionId) => {
        setSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSections(REPORT_SECTIONS.map((s) => s.id));
    };

    const handleClearAll = () => {
        setSections([]);
    };

    const buildExportUrl = (actionType: 'preview' | 'download') => {
        const finalLimit = limitType === 'custom' ? customLimit : limitType;

        return exportPdf.url({
            query: {
                sections,
                record_limit: finalLimit,
                orientation,
                action: actionType,
                category: filters.category,
                sort: filters.sort,
                header_period: filters.headerPeriod,
                chart_period: filters.chartPeriod,
                employee_period: filters.employeePeriod,
                usage_metric: filters.usageMetric,
            },
        });
    };

    const handleAction = async (actionType: 'preview' | 'download') => {
        if (sections.length === 0) {
return;
}

        const url = buildExportUrl(actionType);

        if (actionType === 'preview') {
            setIsPreviewing(true);
            const win = window.open(url, '_blank');

            if (win) {
                win.focus();
            }

            setTimeout(() => setIsPreviewing(false), 1500);
        } else {
            setIsDownloading(true);
            window.location.href = url;
            setTimeout(() => setIsDownloading(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-border bg-card">
                <DialogHeader className="space-y-1.5">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Export Custom PDF Report
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Configure layout options and choose which sections to include in the generated PDF document.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Section Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Report Sections</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    Select All
                                </button>
                                <span className="text-xs text-muted-foreground">&bull;</span>
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {REPORT_SECTIONS.map((section) => {
                                const isChecked = sections.includes(section.id);

                                return (
                                    <div
                                        key={section.id}
                                        onClick={() => handleSectionToggle(section.id)}
                                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${isChecked
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                            : 'border-border hover:bg-accent/50'
                                            }`}
                                    >
                                        <Checkbox
                                            id={`section-${section.id}`}
                                            checked={isChecked}
                                            onCheckedChange={() => handleSectionToggle(section.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-0.5"
                                        />
                                        <div className="grid gap-1">
                                            <Label
                                                htmlFor={`section-${section.id}`}
                                                className="text-sm font-medium text-foreground cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {section.label}
                                            </Label>
                                            <span className="text-xs text-muted-foreground leading-tight">
                                                {section.description}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {sections.length === 0 && (
                            <p className="text-xs text-destructive font-medium mt-1">
                                * Please select at least one section to include in the report.
                            </p>
                        )}
                    </div>

                    {/* Page Layout Settings */}
                    <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-5">
                        {/* Orientation */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                Page Orientation
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={orientation === "portrait" ? "default" : "outline"}
                                    onClick={() => setOrientation("portrait")}
                                >
                                    Portrait (A4)
                                </Button>

                                <Button
                                    type="button"
                                    variant={orientation === "landscape" ? "default" : "outline"}
                                    onClick={() => setOrientation("landscape")}
                                >
                                    Landscape (A4)
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Landscape layout is recommended for reports with wide tables.
                            </p>
                        </div>

                        {/* Record limit */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                Record Limit Per Table
                            </h3>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: "all", label: "All" },
                                    { value: "10", label: "10" },
                                    { value: "50", label: "50" },
                                    { value: "100", label: "100" },
                                    { value: "custom", label: "Custom" },
                                ].map((item) => (
                                    <Button
                                        key={item.value}
                                        type="button"
                                        variant={limitType === item.value ? "default" : "outline"}
                                        className="w-full"
                                        onClick={() => setLimitType(item.value as any)}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </div>

                            {limitType === "custom" && (
                                <Input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={customLimit}
                                    onChange={(e) => setCustomLimit(e.target.value)}
                                    placeholder="Enter record limit"
                                />
                            )}
                        </div>
                    </div>
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
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleAction('preview')}
                            disabled={sections.length === 0 || isDownloading || isPreviewing}
                            className="flex-1 sm:flex-initial cursor-pointer"
                        >
                            {isPreviewing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Eye className="mr-2 h-4 w-4" />
                            )}
                            Preview
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleAction('download')}
                            disabled={sections.length === 0 || isDownloading || isPreviewing}
                            className="flex-1 sm:flex-initial cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isDownloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="mr-2 h-4 w-4" />
                            )}
                            Download PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
