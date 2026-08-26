import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Box,
    CheckCircle,
    ClipboardList,
    Clock,
    Copy,
    FileSpreadsheet,
    FileText,
    History,
    PackageSearch,
    RefreshCcw,
    Terminal,
    Undo2,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { pageStaggerVariants } from '@/components/assets/asset-table-animations';
import { SectionReveal } from '@/components/ui/section-reveal';
import type { SharedData } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocSection {
    id: string;
    title: string;
    icon: React.ElementType;
    description?: string;
    steps?: string[];
    codeBlocks?: { label: string; code: string }[];
    gif?: string;
    actions?: string[];
}

// ─── Shared Sections ─────────────────────────────────────────────────────────

const installationSections: DocSection[] = [
    {
        id: 'installation',
        title: 'Installation',
        icon: Terminal,
        description:
            'Follow these steps to set up the Property Custodian System on your local machine.',
        steps: [
            'Clone the repository from GitHub',
            'Install PHP dependencies with Composer',
            'Install JavaScript dependencies with npm',
            'Configure your environment file',
            'Run database migrations',
            'Start the development servers',
        ],
        codeBlocks: [
            {
                label: 'Clone the repository',
                code: 'git clone https://github.com/coreDevAnchor/property-custodian-system.git\ncd property-custodian-system',
            },
            {
                label: 'Install dependencies',
                code: 'composer install\nnpm install',
            },
            {
                label: 'Configure environment',
                code: 'cp .env.example .env\nphp artisan key:generate',
            },
            {
                label: 'Run migrations and seeders',
                code: 'php artisan migrate --seed',
            },
            {
                label: 'Start development servers',
                code: 'php artisan serve\nnpm run dev',
            },
        ],
    },
    {
        id: 'system-overview',
        title: 'System Overview',
        icon: Box,
        description:
            'The Property Custodian System is a web application for managing organizational assets. It tracks equipment, handles borrow requests, and generates reports. Built with Laravel 13, React 19, and Inertia.js v3.',
    },
];

// ─── Employee Sections ───────────────────────────────────────────────────────

const employeeSections: DocSection[] = [
    {
        id: 'employee-dashboard',
        title: 'Dashboard',
        icon: Box,
        description:
            'Your personal hub showing an overview of your borrowing activity. View statistics for active borrows, pending requests, and recent returns at a glance.',
        actions: [
            'View summary statistics for your borrows',
            'See your current active borrows',
            'Track recent activity and return status',
        ],
        gif: '/docs/employee-dashboard.gif',
    },
    {
        id: 'available-assets',
        title: 'Available Assets',
        icon: PackageSearch,
        description:
            'Browse all assets available for borrowing. Use the search bar and category filters to find exactly what you need.',
        actions: [
            'Search assets by name or description',
            'Filter by category to narrow results',
            'View asset details including condition and location',
            'Submit a borrow request for any available asset',
        ],
        gif: '/docs/employee-available-assets.gif',
    },
    {
        id: 'borrow-request',
        title: 'Borrow Request',
        icon: ClipboardList,
        description:
            'Request to borrow an asset. Fill in the required details including the purpose and expected return date.',
        actions: [
            'Select an asset from the Available Assets page',
            'Provide a reason and expected return date',
            'Specify the quantity when borrowing assets from multi-unit categories',
            'Submit request for custodian approval',
            'Track request status from your dashboard',
        ],
        gif: '/docs/borrow-assets.gif',
    },
    {
        id: 'current-borrows',
        title: 'My Current Borrows',
        icon: Clock,
        description:
            'View all assets you currently have on loan. Track due dates and manage your active borrows.',
        actions: [
            'See all assets currently borrowed',
            'View due dates and borrow status',
            'Request a borrow renewal if you need more time',
            'Initiate a return when ready',
        ],
        gif: '/docs/employee-current-borrows.gif',
    },
    {
        id: 'borrow-renewal',
        title: 'Borrow Renewal',
        icon: RefreshCcw,
        description:
            'Need more time with a borrowed asset? Request a renewal to extend your borrow period.',
        actions: [
            'Select an active borrow to renew',
            'Provide a new expected return date',
            'Submit renewal for custodian approval',
        ],
        gif: '/docs/request-renewal.gif',
    },
    {
        id: 'borrow-history',
        title: 'My Borrow History',
        icon: Undo2,
        description:
            'Review your complete borrowing history. See past borrows, their status, and return dates.',
        actions: [
            'View all past borrows',
            'Filter by status (returned, overdue, etc.)',
            'Check return dates and condition notes',
        ],
        gif: '/docs/employee-borrow-history.gif',
    },
    {
        id: 'return-asset',
        title: 'Return Asset',
        icon: CheckCircle,
        description:
            'Return a borrowed asset. You can request a return from the My Current Borrows page.',
        actions: [
            'Select the asset you want to return',
            'Confirm the return request',
            'Asset condition will be recorded by custodian',
        ],
        gif: '/docs/employee-return-request.gif',
    },
];

// ─── Custodian Sections ──────────────────────────────────────────────────────

const custodianSections: DocSection[] = [
    {
        id: 'custodian-dashboard',
        title: 'Dashboard',
        icon: Box,
        description:
            'The main overview of the property custodian system. Monitor key metrics and recent activity at a glance.',
        actions: [
            'View total assets, pending requests, and active borrows',
            'See a breakdown of assets by category',
            'Review recent activity feed',
            'Quick-access pending borrow requests for approval',
        ],
        gif: '/docs/dashboard.gif',
    },
    {
        id: 'asset-management',
        title: 'Asset Management',
        icon: Box,
        description:
            'Full CRUD operations for managing the organization\'s asset inventory.',
        actions: [
            'Add new assets with name, category, type, and acquisition date',
            'Edit existing asset details',
            'Delete assets no longer in the system',
            'Search and filter assets by name, category, or status',
            'View asset details and borrow history',
            'Assign an owner to each asset via a searchable employee combobox — unassigned assets belong to coreDev',
            'Create new categories and asset types inline from the Add Asset dialog (prefixes are auto-generated)',
            'Track quantity with the Amount field for multi-unit categories',
            'View enhanced asset details showing owner, amount, unit type, and the complete activity log',
        ],
        gif: '/docs/assets.gif',
    },
    {
        id: 'import-assets',
        title: 'Import Assets',
        icon: FileSpreadsheet,
        description:
            'Bulk-import assets from an Excel (XLSX) or CSV spreadsheet instead of creating them one by one.',
        steps: [
            'Click Import on the Assets page and download the XLSX or CSV template',
            'Fill in the required columns: Name, Category, Asset Type, Acquisition Cost, and Total Depreciation (Amount and Owner are optional)',
            'Upload the file — max 5 MB; missing or unknown categories and asset types are created automatically',
            'Fix any reported row errors and re-upload — imports are all-or-nothing, so nothing is saved until every row is valid',
            'Each imported asset gets an auto-generated tag, status Available, condition Excellent, and today\'s acquisition date',
        ],
        gif: '/docs/import-assets.gif',
    },
    {
        id: 'borrow-requests',
        title: 'Borrow Requests',
        icon: ClipboardList,
        description:
            'Review and manage employee borrow requests. Approve or reject requests with optional notes.',
        actions: [
            'View all pending borrow requests',
            'Approve or reject requests with notes',
            'Send overdue reminder notifications',
            'Track request status and history',
        ],
        gif: '/docs/borrow-request.gif',
    },
    {
        id: 'returns-management',
        title: 'Returns',
        icon: RefreshCcw,
        description:
            'Process asset returns from employees. Record condition and update asset status.',
        actions: [
            'View all pending returns',
            'Process returns and record asset condition',
            'Update asset status after return',
            'View return history',
        ],
        gif: '/docs/return-requests.gif',
    },
    {
        id: 'employee-management',
        title: 'Employee Management',
        icon: Users,
        description:
            'Manage employee accounts in the system.',
        actions: [
            'View list of all employees',
            'Add new employee accounts',
            'Edit employee details',
            'Deactivate employee accounts',
        ],
        gif: '/docs/employee-management.gif',
    },
    {
        id: 'custodian-management',
        title: 'Custodian Management',
        icon: Users,
        description:
            'Manage other custodian accounts with appropriate access levels.',
        actions: [
            'View all custodians',
            'Add new custodian accounts',
            'Edit custodian details',
        ],
        gif: '/docs/custodian-management.gif',
    },
    {
        id: 'audit-trail',
        title: 'Audit Trail',
        icon: History,
        description:
            'Complete log of all system activities. Track who did what and when.',
        actions: [
            'View chronological activity log',
            'Filter by action type or user',
            'See details of asset changes, borrow actions, and returns',
        ],
        gif: '/docs/audit-trail.gif',
    },
    {
        id: 'reports',
        title: 'Reports',
        icon: BarChart3,
        description:
            'Generate and export reports for asset management and borrowing activity.',
        actions: [
            'Generate asset summary reports',
            'Export data as CSV or PDF — CSV includes Unit Amount and Ownership columns',
            'View borrowing statistics and trends',
        ],
        gif: '/docs/reports.gif',
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: FileText,
        description:
            'Stay informed about important events in the system. Notifications are delivered in-app, and automated return reminders are also sent via email.',
        actions: [
            'View unread and read notifications',
            'Mark notifications as read or unread',
            'Clear old notifications',
            'Badge count shows unread notifications',
            'Receive 3-day, deadline, and overdue return reminders by email at your registered address (skipped for unverified accounts)',
        ],
        gif: '/docs/notifications.gif',
    },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useScrollSpy(ids: string[]) {
    const [activeId, setActiveId] = useState(ids[0] ?? '');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: '-20% 0px -70% 0px' },
        );

        for (const id of ids) {
            const el = document.getElementById(id);

            if (el) {
observer.observe(el);
}
        }

        return () => observer.disconnect();
    }, [ids]);

    return activeId;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GifPlaceholder({ src }: { src: string }) {
    return (
        <div className="my-6 overflow-hidden rounded-xl border border-border bg-muted/30">
            <img
                src={src}
                alt="Documentation walkthrough"
                className="w-full"
            />
        </div>
    );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="my-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
                <span className="text-xs font-semibold text-muted-foreground">
                    {label}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Copy className="size-3.5" />
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                <code className="font-mono text-foreground">{code}</code>
            </pre>
        </div>
    );
}

function TableOfContents({
    sections,
    activeId,
}: {
    sections: DocSection[];
    activeId: string;
}) {
    function scrollTo(id: string) {
        const el = document.getElementById(id);

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    return (
        <nav className="sticky top-24">
            <h4 className="mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                On this page
            </h4>
            <ul className="space-y-1 border-l border-border">
                {sections.map((section) => (
                    <li key={section.id}>
                        <button
                            onClick={() => scrollTo(section.id)}
                            className={`cursor-pointer w-full text-left border-l-2 py-1.5 pl-4 text-sm transition-colors ${activeId === section.id
                                    ? 'border-primary font-semibold text-primary'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                                }`}
                        >
                            {section.title}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function DocSectionBlock({ section }: { section: DocSection }) {
    const Icon = section.icon;

    return (
        <section id={section.id} className="scroll-mt-24 pb-12">
            <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                    {section.title}
                </h2>
            </div>

            {section.description && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {section.description}
                </p>
            )}

            {section.steps && (
                <ol className="mt-4 space-y-2">
                    {section.steps.map((step, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-3 text-sm text-foreground"
                        >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                        </li>
                    ))}
                </ol>
            )}

            {section.codeBlocks &&
                section.codeBlocks.map((block) => (
                    <CodeBlock
                        key={block.label}
                        label={block.label}
                        code={block.code}
                    />
                ))}

            {section.gif && <GifPlaceholder src={section.gif} />}

            {section.actions && (
                <ul className="mt-4 space-y-2">
                    {section.actions.map((action) => (
                        <li
                            key={action}
                            className="flex items-start gap-2 text-sm text-foreground"
                        >
                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
                            {action}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Documentation() {
    const { props } = usePage<SharedData>();
    const role = props.auth.user?.role ?? 'employee';
    const isCustodian = role === 'custodian';
    const featureSections = isCustodian
        ? custodianSections
        : employeeSections;
    const allSections = [...installationSections, ...featureSections];
    const tocIds = allSections.map((s) => s.id);
    const activeId = useScrollSpy(tocIds);

    return (
        <>
            <Head title="Documentation" />

            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6 lg:p-8"
                variants={pageStaggerVariants}
                initial="hidden"
                animate="show"
            >
                {/* ── Page header ── */}
                <SectionReveal>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            System Documentation
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isCustodian
                                ? 'Guide for custodians on managing assets, borrow requests, and system administration.'
                                : 'Guide for employees on borrowing assets, tracking requests, and managing your borrows.'}
                        </p>
                    </div>
                </SectionReveal>

                {/* ── Two-column layout ── */}
                <div className="flex gap-10">
                    {/* Main content */}
                    <div className="min-w-0 flex-1">
                        {allSections.map((section) => (
                            <DocSectionBlock
                                key={section.id}
                                section={section}
                            />
                        ))}

                        {/* Footer note */}
                        <SectionReveal>
                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                Need help? Contact your system administrator
                                for access issues or technical support.
                            </div>
                        </SectionReveal>
                    </div>

                    {/* Right sidebar TOC */}
                    <div className="hidden w-56 shrink-0 lg:block">
                        <TableOfContents
                            sections={allSections}
                            activeId={activeId}
                        />
                    </div>
                </div>
            </motion.div>
        </>
    );
}
