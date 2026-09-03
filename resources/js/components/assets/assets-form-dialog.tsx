import { zodResolver } from '@hookform/resolvers/zod';
import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ImagePlus, X, CalendarDays } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { AddAssetTypeDialog } from '@/components/assets/add-asset-type-dialog';
import { AddCategoryDialog } from '@/components/assets/add-category-dialog';
import { AddLocationDialog } from '@/components/assets/add-location-dialog';

import { assetSchema } from '@/components/assets/assets-schema';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { SearchableOption } from '@/components/ui/searchable-select';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { Asset, AssetType } from '@/types/assets';
import type { Category } from '@/types/categories';
import type { StagedImage } from '@/types/images';
import type { Location } from '@/types/location';

type FormValues = z.infer<typeof assetSchema>;

interface Props {
    open: boolean;
    mode: 'create' | 'edit';

    asset?: Asset;

    categories: Category[];
    locations: Location[];
    assetTypes: AssetType[];

    onOpenChange: (open: boolean) => void;
}

const conditionOptions = [
    { value: 1, label: 'Poor' },
    { value: 2, label: 'Fair' },
    { value: 3, label: 'Good' },
    { value: 4, label: 'Excellent' },
] as const;

const conditionActiveStyles: Record<number, string> = {
    1: 'bg-red-500 text-white border-red-500',
    2: 'bg-amber-500 text-white border-amber-500',
    3: 'bg-blue-500 text-white border-blue-500',
    4: 'bg-emerald-500 text-white border-emerald-500',
};

// Keep this in sync with the backend's `photo` validation rule
// (`max:2048` KB) so oversized files are rejected before they're even
// staged, instead of only failing after a round-trip to the server.
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

function ConditionScale({
    value,
    onChange,
}: {
    value?: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="flex w-full overflow-hidden rounded-lg border border-border">
            {conditionOptions.map((option, index) => {
                const isActive = value === option.value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`flex-1 cursor-pointer border-border px-3 py-2 text-sm font-semibold transition-colors ${
                            index !== 0 ? 'border-l' : ''
                        } ${
                            isActive
                                ? conditionActiveStyles[option.value]
                                : 'bg-background text-muted-foreground hover:bg-muted/50'
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

const defaultValues: FormValues = {
    name: '',
    description: '',

    category_id: undefined,
    location_id: undefined,
    asset_type_id: undefined,
    condition: undefined,

    serial_number: '',

    acquisition_date: '',
    acquisition_cost: 0,
    depreciation_rate: 0,

    status: 'available',

    amount: 1,
};

export function AssetFormDialog({
    open,
    mode,
    asset,
    categories,
    locations,
    assetTypes,
    onOpenChange,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Image staging state ──
    // Single photo only: the asset can have exactly one image, so this is
    // one nullable slot rather than an array with "add more" support.
    const [image, setImage] = useState<StagedImage | null>(null);
    const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);

    // ── Category/AssetType dialog state ──
    const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
    const [showAddAssetTypeDialog, setShowAddAssetTypeDialog] = useState(false);
    const [showAddLocationDialog, setShowAddLocationDialog] = useState(false);

    // ── Local state for dynamically added categories/asset types/locations ──
    const [localCategories, setLocalCategories] = useState<Category[]>([]);
    const [localAssetTypes, setLocalAssetTypes] = useState<AssetType[]>([]);
    const [localLocations, setLocalLocations] = useState<Location[]>([]);

    // ── Deleted categories/asset types/locations (removed this session) ──
    const [removedCategoryIds, setRemovedCategoryIds] = useState<number[]>([]);
    const [removedAssetTypeIds, setRemovedAssetTypeIds] = useState<number[]>(
        [],
    );
    const [removedLocationIds, setRemovedLocationIds] = useState<number[]>([]);

    // ── Category / Asset Type / Location delete confirmation state ──
    const [deleteTarget, setDeleteTarget] = useState<{
        kind: 'category' | 'asset_type' | 'location';
        id: number;
        name: string;
    } | null>(null);
    const [affectedAssets, setAffectedAssets] = useState<
        { id: number; name: string; asset_tag: string }[]
    >([]);
    const [affectedAssetTypes, setAffectedAssetTypes] = useState<
        { id: number; name: string }[]
    >([]);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(assetSchema),

        defaultValues,
    });

    useEffect(() => {
        if (!open) {
            form.reset(defaultValues);
            form.clearErrors();

            setImage((prev) => {
                if (prev) {
                    URL.revokeObjectURL(prev.url);
                }

                return null;
            });
            setPhotoError(null);
        }
    }, [open]);

    useEffect(() => {
        if (mode === 'edit' && asset) {
            form.reset({
                name: asset.name,
                description: asset.description ?? '',

                category_id: asset.category?.id,
                location_id: asset.location?.id,
                asset_type_id: asset.asset_type?.id,
                condition: asset.condition ?? undefined,

                serial_number: asset.serial_number ?? '',

                acquisition_date: asset.acquisition_date ?? '',
                acquisition_cost: Number(asset.acquisition_cost),
                depreciation_rate: Number(asset.depreciation_rate ?? 0),

                status: asset.status,

                amount: asset.amount ?? 1,
            });
            setExistingPhoto(asset.photo ?? null);
        }

        if (mode === 'create') {
            form.reset({
                name: '',
                description: '',

                category_id: undefined,
                location_id: undefined,
                asset_type_id: undefined,
                condition: undefined,

                serial_number: '',

                acquisition_date: '',
                acquisition_cost: 0,
                depreciation_rate: 0,

                status: 'available',

                amount: 1,
            });
            setExistingPhoto(null);
        }

        // Reset image staging whenever the dialog switches asset/mode.
        setImage((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev.url);
            }

            return null;
        });
        setPhotoError(null);
    }, [open, asset, mode]);

    // Clean up the object URL on unmount.
    useEffect(() => {
        return () => {
            if (image) {
                URL.revokeObjectURL(image.url);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleFileSelected(fileList: FileList | null) {
        if (!fileList || fileList.length === 0) {
            return;
        }

        const file = fileList[0];
        setPhotoError(null);

        if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
            setPhotoError('Only JPG, PNG, or WebP images are allowed.');

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            return;
        }

        if (file.size > MAX_PHOTO_SIZE_BYTES) {
            setPhotoError('That image exceeds the 2MB limit.');

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            return;
        }

        // Replace whatever was staged before — only one photo is kept.
        setImage((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev.url);
            }

            return {
                id: `${file.name}-${file.lastModified}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                file,
                url: URL.createObjectURL(file),
            };
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function handleRemove() {
        setImage((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev.url);
            }

            return null;
        });
    }

    const submit = (data: FormValues) => {
        const payload: Record<string, FormDataConvertible> = { ...data };

        if (image) {
            payload.photo = image.file;
        }

        // Surfaces server-side validation/upload errors (wrong mime type,
        // upload rejected by PHP's own limits, a uniqueness clash, etc.)
        // back onto the matching field instead of failing with no visible
        // feedback.
        const onError = (errors: Record<string, string>) => {
            Object.entries(errors).forEach(([field, message]) => {
                if (field === 'photo') {
                    setPhotoError(message);

                    return;
                }

                form.setError(field as keyof FormValues, {
                    type: 'server',
                    message,
                });
            });

            console.error('Asset save failed:', errors);
        };

        if (mode === 'create') {
            router.post('/custodian/assets', payload, {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Asset created successfully.');
                    onOpenChange(false);
                    form.reset();
                },
                onError,
            });
        } else {
            router.put(`/custodian/assets/${asset?.id}`, payload, {
                forceFormData: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Asset updated successfully.');
                    onOpenChange(false);
                },
                onError,
            });
        }
    };

    const selectedCategoryId = form.watch('category_id');

    const allCategories = [...(categories ?? []), ...localCategories].filter(
        (c) => !removedCategoryIds.includes(c.id),
    );
    const selectedCategory = allCategories.find(
        (c) => c.id === selectedCategoryId,
    );

    const isMultiUnit = selectedCategory?.unit_type === 'multi';

    const allAssetTypes = [...(assetTypes ?? []), ...localAssetTypes].filter(
        (t) => !removedAssetTypeIds.includes(t.id),
    );
    const filteredAssetTypes = allAssetTypes.filter(
        (assetType) =>
            !selectedCategoryId ||
            assetType.category?.id === selectedCategoryId,
    );

    const allLocations = [...(locations ?? []), ...localLocations].filter(
        (l) => !removedLocationIds.includes(l.id),
    );

    function handleDeleteClick(
        kind: 'category' | 'asset_type' | 'location',
        option: SearchableOption,
    ) {
        setDeleteTarget({ kind, id: option.id, name: option.name });
        setAffectedAssets([]);
        setAffectedAssetTypes([]);
        setDeleteLoading(false);

        const url =
            kind === 'category'
                ? `/custodian/categories/${option.id}/check`
                : kind === 'asset_type'
                  ? `/custodian/asset-types/${option.id}/check`
                  : `/custodian/locations/${option.id}/check`;

        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load affected items.');
                }

                return response.json();
            })
            .then((data) => {
                setAffectedAssets(data.assets ?? []);

                if (kind === 'category') {
                    setAffectedAssetTypes(data.asset_types ?? []);
                }
            })
            .catch(() => {
                toast.error('Could not load affected items.');
            });
    }

    function handleConfirmDelete() {
        if (!deleteTarget) {
            return;
        }

        setDeleteLoading(true);

        const resource =
            deleteTarget.kind === 'category'
                ? 'categories'
                : deleteTarget.kind === 'asset_type'
                  ? 'asset-types'
                  : 'locations';

        fetch(`/custodian/${resource}/${deleteTarget.id}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to delete.');
                }

                return response.json();
            })
            .then(() => {
                const target = deleteTarget;

                if (target.kind === 'category') {
                    setRemovedCategoryIds((prev) => [...prev, target.id]);

                    if (selectedCategoryId === target.id) {
                        form.setValue('category_id', undefined);
                    }

                    const sameCategoryTypes = filteredAssetTypes
                        .filter((t) => t.category?.id === target.id)
                        .map((t) => t.id);

                    if (sameCategoryTypes.length > 0) {
                        setRemovedAssetTypeIds((prev) => [
                            ...new Set([...prev, ...sameCategoryTypes]),
                        ]);
                    }

                    if (
                        form.getValues('asset_type_id') !== undefined &&
                        sameCategoryTypes.includes(
                            form.getValues('asset_type_id')!,
                        )
                    ) {
                        form.setValue('asset_type_id', undefined);
                    }
                } else if (target.kind === 'asset_type') {
                    setRemovedAssetTypeIds((prev) => [...prev, target.id]);

                    if (form.getValues('asset_type_id') === target.id) {
                        form.setValue('asset_type_id', undefined);
                    }
                } else {
                    setRemovedLocationIds((prev) => [...prev, target.id]);

                    if (form.getValues('location_id') === target.id) {
                        form.setValue('location_id', undefined);
                    }
                }

                const successMessage =
                    target.kind === 'category'
                        ? `Category "${target.name}" deleted.`
                        : target.kind === 'asset_type'
                          ? `Asset type "${target.name}" deleted.`
                          : `Location "${target.name}" deleted.`;
                toast.success(successMessage);

                setDeleteTarget(null);
                setDeleteLoading(false);

                router.reload({
                    only: ['categories', 'assetTypes', 'locations'],
                });
            })
            .catch((error) => {
                setDeleteLoading(false);
                toast.error(error.message || 'Failed to delete.');
            });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    form.reset(defaultValues);
                    form.clearErrors();
                }

                onOpenChange(value);
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create Asset' : 'Edit Asset'}
                    </DialogTitle>

                    <DialogDescription>
                        {mode === 'create'
                            ? 'Add a new asset to inventory.'
                            : 'Update asset information.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(submit)}
                        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
                    >
                        {/* ── Left: form fields (2/3 width) ── */}
                        <div className="space-y-6 lg:col-span-2">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Name</FormLabel>

                                            <FormControl>
                                                <Input
                                                    placeholder="Dell Latitude 7440"
                                                    {...field}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>

                                        <FormControl>
                                            <Textarea
                                                rows={3}
                                                placeholder="Asset description..."
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>

                                                <FormControl>
                                                    <SearchableSelect
                                                        placeholder="Select category"
                                                        selectedId={field.value}
                                                        options={allCategories.map(
                                                            (category) => ({
                                                                id: category.id,
                                                                name: category.name,
                                                                secondary:
                                                                    category.prefix,
                                                            }),
                                                        )}
                                                        onSelect={(value) =>
                                                            field.onChange(
                                                                value,
                                                            )
                                                        }
                                                        onDelete={(option) =>
                                                            handleDeleteClick(
                                                                'category',
                                                                option,
                                                            )
                                                        }
                                                        onAdd={() =>
                                                            setShowAddCategoryDialog(
                                                                true,
                                                            )
                                                        }
                                                        addLabel="Add New Category"
                                                    />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="asset_type_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Asset Type
                                                </FormLabel>

                                                <FormControl>
                                                    <SearchableSelect
                                                        placeholder="Select asset type"
                                                        selectedId={field.value}
                                                        options={filteredAssetTypes.map(
                                                            (assetType) => ({
                                                                id: assetType.id,
                                                                name: assetType.name,
                                                                secondary:
                                                                    assetType
                                                                        .category
                                                                        ?.name,
                                                            }),
                                                        )}
                                                        onSelect={(value) =>
                                                            field.onChange(
                                                                value,
                                                            )
                                                        }
                                                        onDelete={(option) =>
                                                            handleDeleteClick(
                                                                'asset_type',
                                                                option,
                                                            )
                                                        }
                                                        onAdd={() =>
                                                            setShowAddAssetTypeDialog(
                                                                true,
                                                            )
                                                        }
                                                        addLabel="Add New Asset Type"
                                                    />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="location_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>

                                            <FormControl>
                                                <SearchableSelect
                                                    placeholder="Select location"
                                                    selectedId={field.value}
                                                    options={allLocations.map(
                                                        (l) => ({
                                                            id: l.id,
                                                            name: l.name,
                                                        }),
                                                    )}
                                                    onSelect={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    onAdd={() =>
                                                        setShowAddLocationDialog(
                                                            true,
                                                        )
                                                    }
                                                    addLabel="Add New Location"
                                                    onDelete={(option) =>
                                                        handleDeleteClick(
                                                            'location',
                                                            option,
                                                        )
                                                    }
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>

                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={
                                                    mode === 'edit' &&
                                                    asset?.status === 'borrowed'
                                                }
                                            >
                                                <FormControl className="cursor-pointer">
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    <SelectItem value="available">
                                                        Available
                                                    </SelectItem>
                                                    <SelectItem value="under_repair">
                                                        Under Repair
                                                    </SelectItem>
                                                    <SelectItem value="disposed">
                                                        Pull out
                                                    </SelectItem>
                                                    <SelectItem value="lost">
                                                        Lost
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {mode === 'edit' &&
                                                asset?.status ===
                                                    'borrowed' && (
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        This asset is currently
                                                        borrowed. Its status can
                                                        only be changed after it
                                                        is returned.
                                                    </p>
                                                )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="condition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Condition</FormLabel>

                                            <FormControl>
                                                <ConditionScale
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {isMultiUnit && (
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="1"
                                                    value={field.value ?? 1}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="acquisition_date"
                                    render={({ field }) => {
                                        const selectedDate = field.value
                                            ? new Date(
                                                  `${field.value}T00:00:00`,
                                              )
                                            : undefined;

                                        return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    Acquisition Date
                                                </FormLabel>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className={`h-10 w-full cursor-pointer justify-start text-left font-normal ${
                                                                    !field.value
                                                                        ? 'text-muted-foreground'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <CalendarDays className="mr-2 size-4" />

                                                                {selectedDate
                                                                    ? selectedDate.toLocaleDateString(
                                                                          'en-US',
                                                                          {
                                                                              year: 'numeric',
                                                                              month: 'long',
                                                                              day: 'numeric',
                                                                          },
                                                                      )
                                                                    : 'Select acquisition date'}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>

                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                selectedDate
                                                            }
                                                            onSelect={(
                                                                date,
                                                            ) => {
                                                                if (!date) {
                                                                    field.onChange(
                                                                        '',
                                                                    );

                                                                    return;
                                                                }

                                                                const formattedDate =
                                                                    [
                                                                        date.getFullYear(),
                                                                        String(
                                                                            date.getMonth() +
                                                                                1,
                                                                        ).padStart(
                                                                            2,
                                                                            '0',
                                                                        ),
                                                                        String(
                                                                            date.getDate(),
                                                                        ).padStart(
                                                                            2,
                                                                            '0',
                                                                        ),
                                                                    ].join('-');

                                                                field.onChange(
                                                                    formattedDate,
                                                                );
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />

                                <FormField
                                    control={form.control}
                                    name="acquisition_cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Acquisition Cost
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={
                                                        field.value === 0
                                                            ? ''
                                                            : field.value
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="depreciation_rate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Depreciation Rate (% per year)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={
                                                        field.value === 0
                                                            ? ''
                                                            : field.value
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serial_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Serial Number</FormLabel>

                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* ── Right: single image upload panel (1/3 width) ── */}
                        <div className="lg:col-span-1">
                            <FormLabel className="mb-2 block">
                                Asset Photo
                            </FormLabel>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={(e) =>
                                    handleFileSelected(e.target.files)
                                }
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50"
                            >
                                {image ? (
                                    <>
                                        <img
                                            src={image.url}
                                            alt="Asset preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                                            <span className="text-xs font-semibold text-white">
                                                Click to replace
                                            </span>
                                        </div>
                                    </>
                                ) : existingPhoto ? (
                                    <img
                                        src={`/storage/${existingPhoto}`}
                                        alt="Asset photo"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ImagePlus className="size-8" />
                                        <span className="text-sm font-medium">
                                            Upload a photo
                                        </span>
                                        <span className="text-xs">
                                            One photo per asset
                                        </span>
                                    </div>
                                )}
                            </button>

                            {image && (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                                >
                                    <X className="size-3" />
                                    Remove photo
                                </button>
                            )}

                            {photoError ? (
                                <p className="mt-3 text-xs font-medium text-red-500">
                                    {photoError}
                                </p>
                            ) : (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    PNG, JPG, or WebP, up to 2MB.
                                </p>
                            )}
                        </div>

                        {/* ── Footer spans full width ── */}
                        <DialogFooter className="lg:col-span-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" className="cursor-pointer">
                                {mode === 'create'
                                    ? 'Create Asset'
                                    : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
            <AddCategoryDialog
                open={showAddCategoryDialog}
                onOpenChange={setShowAddCategoryDialog}
                onCreated={(category) => {
                    setLocalCategories((prev) => [...prev, category]);
                    form.setValue('category_id', category.id);
                }}
            />

            <AddAssetTypeDialog
                open={showAddAssetTypeDialog}
                onOpenChange={setShowAddAssetTypeDialog}
                categoryId={selectedCategoryId ?? 0}
                onCreated={(assetType) => {
                    setLocalAssetTypes((prev) => [...prev, assetType]);
                    form.setValue('asset_type_id', assetType.id);
                }}
            />

            <AddLocationDialog
                open={showAddLocationDialog}
                onOpenChange={setShowAddLocationDialog}
                onCreated={(location) => {
                    setLocalLocations((prev) => [...prev, location]);
                    form.setValue('location_id', location.id);
                }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(value) => {
                    if (!value && !deleteLoading) {
                        setDeleteTarget(null);
                    }
                }}
                title={
                    deleteTarget?.kind === 'category'
                        ? `Delete Category "${deleteTarget?.name}"?`
                        : deleteTarget?.kind === 'asset_type'
                          ? `Delete Asset Type "${deleteTarget?.name}"?`
                          : `Delete Location "${deleteTarget?.name}"?`
                }
                description={
                    deleteTarget?.kind === 'category'
                        ? `This will permanently delete the category${affectedAssetTypes.length > 0 ? ` and its ${affectedAssetTypes.length} asset type${affectedAssetTypes.length === 1 ? '' : 's'}` : ''}. The following assets will become unspecified:`
                        : deleteTarget?.kind === 'asset_type'
                          ? `This will permanently delete the asset type. The following assets will lose their type:`
                          : `This will permanently delete the location. The following assets will become unspecified:`
                }
                confirmLabel="Delete"
                confirmVariant="destructive"
                loading={deleteLoading}
                onConfirm={handleConfirmDelete}
                details={
                    affectedAssets.length > 0 ? (
                        <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                            <ul className="list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
                                {affectedAssets.map((asset) => (
                                    <li key={asset.id}>
                                        {asset.name}{' '}
                                        <span className="text-xs text-muted-foreground">
                                            ({asset.asset_tag})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-sm text-muted-foreground">
                            No assets are currently assigned to this{' '}
                            {deleteTarget?.kind === 'category'
                                ? 'category'
                                : deleteTarget?.kind === 'asset_type'
                                  ? 'asset type'
                                  : 'location'}
                            .
                        </div>
                    )
                }
            />
        </Dialog>
    );
}
