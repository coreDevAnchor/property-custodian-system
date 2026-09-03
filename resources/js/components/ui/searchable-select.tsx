import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface SearchableOption {
    id: number;
    name: string;
    prefix?: string;
    secondary?: string;
}

interface Props {
    placeholder: string;
    selectedId?: number;
    options: SearchableOption[];
    onSelect: (id: number) => void;
    onDelete: (option: SearchableOption) => void;
    onAdd?: () => void;
    addLabel?: string;
}

export function SearchableSelect({
    placeholder,
    selectedId,
    options,
    onSelect,
    onDelete,
    onAdd,
    addLabel,
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selected = options.find((option) => option.id === selectedId);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return options;
        }

        return options.filter((option) => {
            const name = option.name.toLowerCase();
            const prefix = option.prefix?.toLowerCase() ?? '';
            const secondary = option.secondary?.toLowerCase() ?? '';

            return (
                name.includes(query) ||
                prefix.includes(query) ||
                secondary.includes(query)
            );
        });
    }, [options, search]);

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    setSearch('');
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-full cursor-pointer justify-between font-normal ${selected ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                    <span className="truncate">{selected?.name ?? placeholder}</span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
            >
                <div className="border-b border-border p-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search..."
                            className="h-9 pl-8"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                            No {placeholder.toLowerCase()} found.
                        </p>
                    ) : (
                        filtered.map((option) => {
                            const isSelected = option.id === selectedId;

                            return (
                                <div
                                    key={option.id}
                                    role="option"
                                    aria-selected={isSelected}
                                    className="group flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                                    onClick={() => {
                                        onSelect(option.id);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="truncate font-medium text-foreground">
                                            {option.name}
                                        </span>

                                        {(option.prefix || option.secondary) && (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {[option.prefix, option.secondary]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </span>
                                        )}
                                    </span>

                                    <span className="flex shrink-0 items-center gap-1">
                                        {isSelected && (
                                            <Check className="size-4 text-primary" />
                                        )}

                                        <button
                                            type="button"
                                            aria-label={`Delete ${option.name}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDelete(option);
                                            }}
                                            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {onAdd && addLabel && (
                    <div className="border-t border-border p-1">
                        <button
                            type="button"
                            onClick={() => {
                                onAdd();
                                setOpen(false);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/10"
                        >
                            <Plus className="size-4" />
                            {addLabel}
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
