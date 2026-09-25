import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Printer, Search } from 'lucide-react';
import { useState } from 'react';
import { rowVariants } from '@/components/assets/asset-table-animations';
import { AnimatedTableBody } from '@/components/ui/animated-table-body';
import { PaginationBar } from '@/components/ui/pagination';
import { dashboard } from '@/routes/custodian';
import { index, markPrinted, print } from '@/routes/custodian/receipts';
import type { Paginated } from '@/types/pagination';

type ReceiptItem = {
    id: number;
    receipt_number: string;
    borrower: { name: string } | null;
    employee: { employee_id: string | null; department: string | null } | null;
    asset: {
        name: string;
        asset_tag: string;
        category?: { name: string | null } | null;
    } | null;
    borrow_amount: number | null;
    approved_at: string | null;
    expected_return_date: string | null;
};

type Props = {
    receipts: Paginated<ReceiptItem>;
    filters: { search: string; per_page: number };
};

export default function Receipts({ receipts, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function handlePrint(receipt: ReceiptItem) {
        window.open(print.url(receipt.id), '_blank');
    }

    function handleDone(receipt: ReceiptItem) {
        router.post(
            markPrinted.url(receipt.id),
            {},
            {
                preserveScroll: true,
            },
        );
    }

    function submitSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            index.url(),
            { search, per_page: receipts.per_page },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['receipts'],
            },
        );
    }

    function changePage(page: number) {
        if (page >= 1 && page <= receipts.last_page) {
            router.get(
                index.url(),
                { search, per_page: receipts.per_page, page },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['receipts'],
                },
            );
        }
    }

    function changePerPage(perPage: number) {
        router.get(
            index.url(),
            { search, per_page: perPage, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['receipts'],
            },
        );
    }

    return (
        <>
            <Head title="Receipts" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Acknowledgement Receipts
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Unprinted receipts for approved borrows — print
                            them for the borrower to sign
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="border-b border-border px-6 py-4">
                        <form onSubmit={submitSearch} className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by borrower, asset, or department..."
                                className="flex h-10 w-full rounded-lg border border-border bg-background pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Receipt No.
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Borrower
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Asset
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Issued
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Due
                                    </th>
                                    <th className="py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <AnimatedTableBody
                                loading={false}
                                animate
                                animationKey={`${receipts.current_page}-${search}`}
                            >
                                {receipts.data.map((receipt) => (
                                    <motion.tr
                                        variants={rowVariants}
                                        key={receipt.id}
                                        className="group border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                                    >
                                        <td className="py-3.5 pr-4 text-sm font-semibold">
                                            {receipt.receipt_number}
                                        </td>
                                        <td className="py-3.5 pr-4">
                                            <p className="text-sm font-medium">
                                                {receipt.borrower?.name ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {receipt.employee?.department ?? '—'}
                                                {receipt.employee?.employee_id
                                                    ? ` · ${receipt.employee.employee_id}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="py-3.5 pr-4">
                                            <p className="text-sm text-foreground">
                                                {receipt.asset?.name ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {receipt.asset?.asset_tag ?? ''}
                                                {receipt.asset?.category?.name
                                                    ? ` · ${receipt.asset.category.name}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                            {receipt.approved_at
                                                ? new Date(receipt.approved_at).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                            {receipt.expected_return_date
                                                ? new Date(receipt.expected_return_date).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDone(receipt)}
                                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
                                                    aria-label={`Mark receipt ${receipt.receipt_number} as printed`}
                                                >
                                                    <CheckCircle2 className="size-4 text-green-600" />
                                                    Done
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(receipt)}
                                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98]"
                                                    aria-label={`Print receipt ${receipt.receipt_number}`}
                                                >
                                                    <Printer className="size-4" />
                                                    Print
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatedTableBody>
                        </table>

                        {receipts.data.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <FileText className="size-8 text-muted-foreground" />
                                <p className="text-sm font-semibold">
                                    No unprinted receipts
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Approved borrows awaiting a printed receipt
                                    will appear here.
                                </p>
                            </div>
                        )}
                    </div>

                    <PaginationBar
                        currentPage={receipts.current_page}
                        lastPage={receipts.last_page}
                        total={receipts.total}
                        from={receipts.from}
                        to={receipts.to}
                        perPage={receipts.per_page}
                        itemLabel="receipts"
                        onPageChange={changePage}
                        onPerPageChange={changePerPage}
                    />
                </div>
            </div>
        </>
    );
}

Receipts.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Receipts', href: index.url() },
    ],
};