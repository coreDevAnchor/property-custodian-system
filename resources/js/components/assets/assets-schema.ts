import * as z from "zod";

export const assetSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),

    category_id: z.number(),
    location_id: z.number().nullable(),

    serial_number: z.string().optional(),

    acquisition_date: z.string(),

    status: z.enum([
        "available",
        "borrowed",
        "under_repair",
        "disposed",
    ]),

});