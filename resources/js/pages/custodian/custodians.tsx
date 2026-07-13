import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes/custodian';
import { destroy, store, update } from '@/routes/custodian/custodians';
import type { SharedData } from '@/types';

interface Custodian {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface Props {
    custodians: {
        data: Custodian[];
    };
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
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {isEditing ? 'Save Changes' : 'Add Custodian'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Custodians({ custodians }: Props) {
    const { props } = usePage<SharedData>();
    const [search, setSearch] = useState('');
    const [formTarget, setFormTarget] = useState<
        Custodian | null | undefined
    >();
    const [deleteTarget, setDeleteTarget] = useState<Custodian | null>(null);
    const deleteForm = useForm({});

    const filteredCustodians = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();

        return custodians.data.filter(
            (custodian) =>
                !searchTerm ||
                custodian.name.toLowerCase().includes(searchTerm) ||
                custodian.email.toLowerCase().includes(searchTerm),
        );
    }, [custodians, search]);

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
                                    <th className="py-3 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustodians.map((custodian) => {
                                    const isCurrentUser =
                                        custodian.id === props.auth.user?.id;

                                    return (
                                        <tr
                                            key={custodian.id}
                                            className="border-b border-border last:border-0 hover:bg-muted/50"
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
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            setFormTarget(
                                                                custodian,
                                                            )
                                                        }
                                                        aria-label={`Edit ${custodian.name}`}
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        disabled={isCurrentUser}
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                custodian,
                                                            )
                                                        }
                                                        aria-label={`Remove ${custodian.name}`}
                                                    >
                                                        <Trash2 className="text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredCustodians.length === 0 && (
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

                    <div className="border-t border-border px-6 py-3.5 text-xs text-muted-foreground">
                        Showing {filteredCustodians.length} of{' '}
                        {custodians.data.length} custodians
                    </div>
                </div>
            </div>

            {formTarget !== undefined && (
                <CustodianFormDialog
                    custodian={formTarget ?? undefined}
                    onOpenChange={(open) => !open && setFormTarget(undefined)}
                />
            )}

            <Dialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove custodian account?</DialogTitle>
                        <DialogDescription>
                            {deleteTarget &&
                                `${deleteTarget.name} will no longer be able to access the custodian dashboard.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={removeCustodian}
                            disabled={deleteForm.processing}
                        >
                            Remove Custodian
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Custodians.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Custodians', href: '/custodian/custodians' },
    ],
};
