import { z } from "zod";

export const sectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60)
    .refine((v) => !/[\u0000-\u001f\u007f<>]/.test(v), "Invalid characters"),
  prefix: z
    .string()
    .trim()
    .max(4)
    .regex(/^[A-Za-z0-9]*$/, "Code prefix: letters and numbers only")
    .transform((v) => v.toUpperCase()),
});
