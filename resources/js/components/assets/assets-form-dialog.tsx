import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Star, X } from "lucide-react";
import type { FormDataConvertible } from "@inertiajs/core";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import { assetSchema } from "@/components/assets/assets-schema";
import type { z } from "zod";
import type { Asset, Category } from "@/components/assets/types";

type FormValues = z.infer<typeof assetSchema>;

interface AssetLocation {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    mode: "create" | "edit";

    asset?: Asset;

    categories: Category[];
    locations: AssetLocation[];
    assetTypes: AssetType[];

    onOpenChange: (open: boolean) => void;
}

interface StagedImage {
    id: string;
    file: File;
    url: string;
}

interface AssetType {
    id: number;
    name: string;
    prefix: string;
    category: {
        id: number;
        name: string;
    };
}

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
    const [images, setImages] = useState<StagedImage[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(assetSchema),

        defaultValues: {
            name: "",
            description: "",

            category_id: undefined,
            location_id: undefined,
            asset_type_id: undefined,

            serial_number: "",

            acquisition_date: "",

            status: "available",
        },
    });

    useEffect(() => {
        if (mode === "edit" && asset) {
            console.log(asset);

            form.reset({
                name: asset.name,
                description: asset.description ?? "",

                category_id: asset.category.id,
                location_id: asset.location.id,
                asset_type_id: asset.asset_type.id,

                serial_number: asset.serial_number ?? "",

                acquisition_date: asset.acquisition_date,

                status: asset.status,
            });
        }

        if (mode === "create") {
            form.reset();
        }

        // Reset image staging whenever the dialog switches asset/mode.
        setImages((prev) => {
            prev.forEach((img) => URL.revokeObjectURL(img.url));
            return [];
        });
    }, [asset, mode]);

    // Clean up object URLs on unmount.
    useEffect(() => {
        return () => {
            images.forEach((img) => URL.revokeObjectURL(img.url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleFilesSelected(fileList: FileList | null) {
        if (!fileList || fileList.length === 0) return;

        const next: StagedImage[] = Array.from(fileList).map((file) => ({
            id: `${file.name}-${file.lastModified}-${Math.random()
                .toString(36)
                .slice(2)}`,
            file,
            url: URL.createObjectURL(file),
        }));

        setImages((prev) => [...prev, ...next]);

        // Allow re-selecting the same file again later.
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleMakeMain(id: string) {
        setImages((prev) => {
            const index = prev.findIndex((img) => img.id === id);
            if (index <= 0) return prev;
            const copy = [...prev];
            const [chosen] = copy.splice(index, 1);
            copy.unshift(chosen);
            return copy;
        });
    }

    function handleRemove(id: string) {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter((img) => img.id !== id);
        });
    }

    const mainImage = images[0];
    const subImages = images.slice(1);

    const submit = (data: FormValues) => {
        // Only the main (first) staged image is sent, since the backend
        // currently stores a single `photo` per asset.
        const payload: Record<string, FormDataConvertible> = { ...data };
        if (mainImage) {
            payload.photo = mainImage.file;
        }

        if (mode === "create") {
            router.post("/custodian/assets", payload, {
                forceFormData: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        } else {
            router.put(`/custodian/assets/${asset?.id}`, payload, {
                forceFormData: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        }
    };

    const selectedCategoryId = form.watch("category_id");

    console.log("categories", categories);
    console.log("locations", locations);
    console.log("assetTypes", assetTypes);
    const filteredAssetTypes = (assetTypes ?? []).filter(
        (assetType) =>
            !selectedCategoryId ||
            assetType.category?.id === selectedCategoryId
    );

    console.log("categories", categories);
    console.log("locations", locations);
    console.log("assetTypes", assetTypes);
    console.log("filteredAssetTypes", filteredAssetTypes);
    console.log("subImages", subImages);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create Asset" : "Edit Asset"}
                    </DialogTitle>

                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new asset to inventory."
                            : "Update asset information."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(submit)}
                        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
                    >
                        {/* ── Left: form fields (2/3 width) ── */}
                        <div className="space-y-6 lg:col-span-2">
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
                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>

                                            <Select
                                                value={field.value?.toString()}
                                                onValueChange={(value) =>
                                                    field.onChange(Number(value))
                                                }
                                            >
                                                <FormControl className="cursor-pointer">
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {(categories ?? []).map((category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={category.id.toString()}
                                                        >
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="asset_type_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Type</FormLabel>

                                            <Select
                                                value={field.value?.toString()}
                                                onValueChange={(value) =>
                                                    field.onChange(Number(value))
                                                }
                                            >
                                                <FormControl className="cursor-pointer">
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select asset type" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {filteredAssetTypes.map((assetType) => (
                                                        <SelectItem
                                                            key={assetType.id}
                                                            value={assetType.id.toString()}
                                                        >
                                                            {assetType.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="location_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>

                                            <Select
                                                value={field.value?.toString()}
                                                onValueChange={(value) =>
                                                    field.onChange(Number(value))
                                                }
                                            >
                                                <FormControl className="cursor-pointer">
                                                    <SelectTrigger >
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {(locations ?? []).map((location) => (
                                                        <SelectItem
                                                            key={location.id}
                                                            value={location.id.toString()}
                                                        >
                                                            {location.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

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
                                                    <SelectItem value="borrowed">
                                                        Borrowed
                                                    </SelectItem>
                                                    <SelectItem value="under_repair">
                                                        Under Repair
                                                    </SelectItem>
                                                    <SelectItem value="disposed">
                                                        Disposed
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="acquisition_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Acquisition Date</FormLabel>

                                            <FormControl className="cursor-pointer">
                                                <Input type="date" {...field} />
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

                        {/* ── Right: image upload panel (1/3 width) ── */}
                        <div className="lg:col-span-1">
                            <FormLabel className="mb-2 block">
                                Asset Photos
                            </FormLabel>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files)}
                            />

                            {/* Main image */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                            >
                                {mainImage ? (
                                    <>
                                        <img
                                            src={mainImage.url}
                                            alt="Main asset preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                                            <Star className="size-3 fill-current" />
                                            Main
                                        </span>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                                            <span className="text-xs font-semibold text-white">
                                                Click to add more
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ImagePlus className="size-8" />
                                        <span className="text-sm font-medium">
                                            Upload photos
                                        </span>
                                        <span className="text-xs">
                                            First photo becomes the main image
                                        </span>
                                    </div>
                                )}
                            </button>

                            {/* Sub image thumbnails */}
                            {subImages.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {subImages.map((img) => (
                                        <div
                                            key={img.id}
                                            className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleMakeMain(img.id)}
                                                className="h-full w-full"
                                                title="Set as main photo"
                                            >
                                                <img
                                                    src={img.url}
                                                    alt="Asset sub preview"
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRemove(img.id)}
                                                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                aria-label="Remove photo"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add more tile */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                                    >
                                        <ImagePlus className="size-4" />
                                    </button>
                                </div>
                            )}

                            {mainImage && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(mainImage.id)}
                                    className="mt-2 text-xs font-medium text-red-500 hover:underline"
                                >
                                    Remove main photo
                                </button>
                            )}

                            <p className="mt-3 text-xs text-muted-foreground">
                                Click any thumbnail to make it the main photo. PNG or JPG, up to 2MB.
                            </p>
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
                                {mode === "create" ? "Create Asset" : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}