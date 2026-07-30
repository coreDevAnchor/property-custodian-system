import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Eye,
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/custodian';
import { destroy, store, update } from '@/routes/custodian/custodians';
import { router } from '@inertiajs/react';
import { PaginationBar } from '@/components/ui/pagination';
import { CustodianDeleteDialog } from '@/components/custodian/custodian-delete-dialog';
import type { SharedData } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { Custodian, Filters } from '@/types/custodian';

interface Props {
    custodians: Paginated<Custodian>;
    filters: Filters;
}

function CustodianFormDialog({
    custodian,
    onOpenChange,
}: {
    custodian?: Custodian;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = Boolean(custodian);
    const form = useForm({
        name: custodian?.name ?? '',
        email: custodian?.email ?? '',
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            onSuccess: () => onOpenChange(false),
        };

        if (custodian) {
            form.put(update(custodian.id).url, options);

            return;
        }

        form.post(store().url, options);
    }

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Custodian' : 'Add Custodian'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update this custodian account details.'
                            : 'Create a custodian account with the default password Password123!.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4">
                    <label className="grid gap-2 text-sm font-medium">
                        Full name
                        <Input
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.name)}
                            autoFocus
                        />
                        {form.errors.name && (
                            <span className="text-xs text-destructive">
                                {form.errors.name}
                            </span>
                        )}
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Email address
                        <Input
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.email)}
                        />
                        {form.errors.email && (
                            <span className="text-xs text-destructive">
                                {form.errors.email}
                            </span>
                        )}
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            className="cursor-pointer"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit"
                            className="cursor-pointer"
                            disabled={form.processing}>
                            {isEditing ? 'Save Changes' : 'Add Custodian'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Custodians({ custodians, filters }: Props) {
    const { props } = usePage<SharedData>();
    const [search, setSearch] = useState(filters.search ?? '');
    const [formTarget, setFormTarget] = useState<
        Custodian | null | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<Custodian | null>(null);
    const deleteForm = useForm({});

    // ── Server-driven filtering/pagination ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    function fetchPage(page: number, overrides: Partial<Filters> = {}) {
        router.get(
            '/custodian/custodians',
            {
                search: overrides.search ?? search,
                per_page: overrides.per_page ?? custodians.per_page,
                page,
            },
            { preserveState: true, preserveScroll: true, replace: true, only: ['custodians', 'filters'] },
        );
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPage(1), 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function handlePerPageChange(value: number) {
        fetchPage(1, { per_page: value });
    }

    function handlePageChange(page: number) {
        fetchPage(page);
    }

    function removeCustodian() {
        if (!deleteTarget) {
            return;
        }

        deleteForm.delete(destroy(deleteTarget.id).url, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Custodians" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                            Custodians
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage property custodian accounts
                        </p>
                    </div>
                    <Button
                        onClick={() => setFormTarget(null)}
                        className="cursor-pointer"
                    >
                        <Plus />
                        Add Custodian
                    </Button>
                </div>

                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="border-b border-border px-6 py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by name or email..."
                                className="h-10 pl-10"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto px-6 pb-2">
                        <table className="w-full min-w-[620px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Custodian
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Email
                                    </th>
                                    <th className="py-3 pr-4 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Added
                                    </th>
                                    <th className="py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {custodians.data.map((custodian) => {
                                    const isCurrentUser =
                                        custodian.id === props.auth.user?.id;

                                    const activeBorrows = custodian.borrows?.filter(
                                        (b) => b.status === 'borrowed' || b.status === 'awaiting_check'
                                    );

                                    return (
                                        <tr
                                            key={custodian.id}
                                            className="group border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="py-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <ShieldCheck className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">
                                                            {custodian.name}
                                                        </p>
                                                        {isCurrentUser && (
                                                            <p className="text-xs text-muted-foreground">
                                                                You
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="size-3.5" />
                                                    {custodian.email}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pr-4 text-sm text-muted-foreground">
                                                {new Date(
                                                    custodian.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <div className="flex justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button
                                                        onClick={() =>
                                                            setFormTarget(
                                                                custodian,
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500 cursor-pointer"
                                                        aria-label={`Edit ${custodian.name}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            !isCurrentUser &&
                                                            setDeleteTarget(
                                                                custodian,
                                                            )
                                                        }
                                                        disabled={isCurrentUser}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                                                        aria-label={`Remove ${custodian.name}`}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>

                                                    <HoverCard>
                                                        <HoverCardTrigger asChild>
                                                            <button
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                                                                aria-label={`View borrowed items for ${custodian.name}`}
                                                            >
                                                                <Eye className="size-4" />
                                                            </button>
                                                        </HoverCardTrigger>

                                                        <HoverCardContent className="w-80">
                                                            <div className="space-y-3">
                                                                <h4 className="font-semibold">Borrowed Items</h4>

                                                                {activeBorrows?.length ? (
                                                                    activeBorrows.map((borrow) => (
                                                                        <div
                                                                            key={borrow.id}
                                                                            className="border-b border-border pb-2 last:border-0"
                                                                        >
                                                                            <div className="font-medium">
                                                                                {borrow.asset.name}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {borrow.asset.asset_tag}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                Since{' '}
                                                                                {new Date(
                                                                                    borrow.requested_at
                                                                                ).toLocaleDateString()}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        No items currently borrowed.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {custodians.data.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <UserRound className="size-8 text-muted-foreground" />
                                <p className="text-sm font-semibold">
                                    No custodians found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Try a different search or add a custodian
                                    account.
                                </p>
                            </div>
                        )}
                    </div>

                    <PaginationBar
                        currentPage={custodians.current_page}
                        lastPage={custodians.last_page}
                        total={custodians.total}
                        from={custodians.from}
                        to={custodians.to}
                        perPage={custodians.per_page}
                        itemLabel="custodians"
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                </div>
            </div>

            {formTarget !== undefined && (
                <CustodianFormDialog
                    custodian={formTarget ?? undefined}
                    onOpenChange={(open) => !open && setFormTarget(undefined)}
                />
            )}

            <CustodianDeleteDialog
                custodian={deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={removeCustodian}
                processing={deleteForm.processing}
            />
        </>
    );
}

Custodians.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Custodians', href: '/custodian/custodians' },
    ],
};