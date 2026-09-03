import { Eye, FileDown, Loader2, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { exportPdf } from '@/routes/custodian/reports';
import type { EmployeeOption } from '@/types/reports';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees?: EmployeeOption[];
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

type Tab = 'standard' | 'employees';

export function ExportPdfModal({ open, onOpenChange, employees = [], filters }: Props) {
    const [tab, setTab] = useState<Tab>('standard');
    const [sections, setSections] = useState<SectionId[]>([
        'summary',
        'usage_chart',
        'assets',
        'overdue',
        'lost',
        'borrowers',
    ]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [limitType, setLimitType] = useState<'all' | '10' | '50' | '100' | 'custom'>('all');
    const [customLimit, setCustomLimit] = useState<string>('200');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const filteredEmployees = useMemo(() => {
        const q = employeeSearch.trim().toLowerCase();

        if (!q) {
            return employees;
        }

        return employees.filter((e) =>
            (e.name ?? '').toLowerCase().includes(q) ||
            (e.email ?? '').toLowerCase().includes(q) ||
            (e.department ?? '').toLowerCase().includes(q) ||
            (e.employee_id ?? '').toLowerCase().includes(q)
        );
    }, [employees, employeeSearch]);

    const handleSectionToggle = (id: SectionId) => {
        setSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleSelectAllSections = () => {
        setSections(REPORT_SECTIONS.map((s) => s.id));
    };

    const handleClearAllSections = () => {
        setSections([]);
    };

    const handleEmployeeToggle = (id: number) => {
        setSelectedEmployees((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    const handleSelectAllEmployees = () => {
        setSelectedEmployees(filteredEmployees.map((e) => e.id));
    };

    const handleClearAllEmployees = () => {
        setSelectedEmployees([]);
    };

    const hasSelection = tab === 'standard' ? sections.length > 0 : selectedEmployees.length > 0;

    const buildExportUrl = (actionType: 'preview' | 'download') => {
        const finalLimit = limitType === 'custom' ? customLimit : limitType;

        const query: Record<string, string | string[] | number[] | number> = {
            record_limit: finalLimit,
            orientation,
            action: actionType,
            category: filters.category,
            sort: filters.sort,
            header_period: filters.headerPeriod,
            chart_period: filters.chartPeriod,
            employee_period: filters.employeePeriod,
            usage_metric: filters.usageMetric,
        };

        if (tab === 'employees') {
            query.employees = selectedEmployees;
        } else {
            query.sections = [...sections];
        }

        return exportPdf.url({ query });
    };

    const handleAction = async (actionType: 'preview' | 'download') => {
        if (!hasSelection) {
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
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-border bg-card">
                <DialogHeader className="space-y-1.5">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Export Custom PDF Report
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Configure the report type, layout, and content to include in the generated PDF document.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="standard" className="cursor-pointer">
                            Standard Report
                        </TabsTrigger>
                        <TabsTrigger value="employees" className="cursor-pointer">
                            <Users className="mr-1.5 size-3.5" />
                            Employee Accounts
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="standard" className="space-y-6 py-4">
                        {/* Section Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground">Report Sections</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllSections}
                                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-xs text-muted-foreground">&bull;</span>
                                    <button
                                        type="button"
                                        onClick={handleClearAllSections}
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
                    </TabsContent>

                    <TabsContent value="employees" className="space-y-4 py-4">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Generate an account history report for each selected employee. Each account
                                includes the employee's account information and their full borrow / return
                                activity — no inventory or summary sections.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground">
                                    Employees ({selectedEmployees.length} selected)
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllEmployees}
                                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-xs text-muted-foreground">&bull;</span>
                                    <button
                                        type="button"
                                        onClick={handleClearAllEmployees}
                                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    placeholder="Search by name, email, department, or employee ID…"
                                    className="pl-9"
                                />
                            </div>

                            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
                                {filteredEmployees.length === 0 && (
                                    <p className="py-8 text-center text-xs text-muted-foreground">
                                        No employees found.
                                    </p>
                                )}

                                {filteredEmployees.map((emp) => {
                                    const isChecked = selectedEmployees.includes(emp.id);

                                    return (
                                        <div
                                            key={emp.id}
                                            onClick={() => handleEmployeeToggle(emp.id)}
                                            className={`flex items-start gap-3 rounded-lg p-2.5 border transition-all duration-200 cursor-pointer ${isChecked
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                : 'border-transparent hover:bg-accent/50'
                                                }`}
                                        >
                                            <Checkbox
                                                id={`employee-${emp.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => handleEmployeeToggle(emp.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-0.5"
                                            />
                                            <div className="grid gap-0.5 min-w-0">
                                                <Label
                                                    htmlFor={`employee-${emp.id}`}
                                                    className="text-sm font-medium text-foreground cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {emp.name}
                                                </Label>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {[emp.email, emp.department, emp.employee_id]
                                                        .filter(Boolean)
                                                        .join(' · ') || 'No details'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedEmployees.length === 0 && (
                                <p className="text-xs text-destructive font-medium">
                                    * Please select at least one employee to include in the report.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

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
                            disabled={!hasSelection || isDownloading || isPreviewing}
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
                            disabled={!hasSelection || isDownloading || isPreviewing}
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
