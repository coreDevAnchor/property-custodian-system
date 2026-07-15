// employee-schema.ts
import { z } from "zod";

export const employeeSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Full name is required."),

    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),

    department: z
        .string()
        .min(1, "Please select a department."),

    contact: z
        .string()
        .trim()
        .min(1, "Contact number is required.")
        .regex(
            /^09\d{9}$/,
            "Contact number must be 11 digits and start with 09."
        ),

    password: z.string().optional(),

    employee_id: z.string().optional(),

    is_active: z.boolean(),
});