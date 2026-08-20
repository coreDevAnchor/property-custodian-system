import { z } from "zod";

export const assetSchema = z.object({
    name: z.string()
        .trim()
        .min(1, "Enter an asset name."),

    description: z.string().optional(),

    category_id: z.number()
        .optional()
        .refine(v => v !== undefined, {
            message: "Select a category.",
        }),

    asset_type_id: z.number()
        .optional()
        .refine(v => v !== undefined, {
            message: "Select an asset type.",
        }),

    location_id: z.number()
        .optional()
        .refine(v => v !== undefined, {
            message: "Select a location.",
        }),

    condition: z.number()
        .optional()
        .refine(v => v !== undefined, {
            message: "Select the asset condition.",
        }),

    acquisition_date: z.string()
        .min(1, "Select an acquisition date."),

    acquisition_cost: z
        .number()
        .min(0, "Acquisition cost cannot be negative."),

    depreciation_rate: z
        .number()
        .min(0, "Depreciation rate cannot be negative.")
        .max(100, "Depreciation rate cannot exceed 100%."),

    serial_number: z.string().optional(),

    status: z.string(),

    amount: z.number().min(1, "Amount must be at least 1.").optional(),
});