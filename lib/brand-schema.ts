import { z } from "zod";
import { HEX_COLOR } from "./brands";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !/[\u0000-\u001f\u007f<>]/.test(v), "Invalid characters");

export const brandSchema = z.object({
  name: text(60).pipe(z.string().min(1, "Name is required")),
  short: text(6).default(""),
  hint: text(80).default(""),
  accept: z
    .string()
    .trim()
    .max(120)
    .default("")
    .refine(
      (v) => v === "" || v.split(",").every((e) => /^\.[a-zA-Z0-9]{1,10}$/.test(e.trim())),
      'File types like ".xml, .zip" (comma separated)',
    )
    .transform((v) =>
      v
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
        .join(","),
    ),
  color: z.string().regex(HEX_COLOR, "Colour must look like #1a2b3c"),
  textColor: z.string().regex(HEX_COLOR, "Colour must look like #ffffff"),
  enabled: z.boolean().default(true),
});
