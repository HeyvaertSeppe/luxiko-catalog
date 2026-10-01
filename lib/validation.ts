import { z } from "zod";
import type { ProductInput } from "./products";

export const productSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(40)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Code may only contain letters, numbers, dot, dash and underscore"),
  name: z.string().trim().max(120).default(""),
  section: z.string().trim().min(1, "Category is required").max(80),
  series: z.enum(["B", "S", "P"]).nullable().default(null),
  ip: z.string().trim().max(20).default("IP N/A"),
  description: z.string().trim().max(5000).default(""),
  dmxModes: z.array(z.string().trim().min(1).max(30)).max(40).default([]),
  capabilities: z
    .array(z.object({ label: z.string().trim().min(1).max(40), enabled: z.boolean() }))
    .max(60)
    .default([]),
  specs: z
    .array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(300) }))
    .max(80)
    .default([]),
  published: z.boolean().default(true),
  needsReview: z.boolean().default(false),
});

export function parseProduct(body: unknown): { ok: true; data: ProductInput } | { ok: false; error: string } {
  const r = productSchema.safeParse(body);
  if (!r.success) {
    const issue = r.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : "Invalid input" };
  }
  return { ok: true, data: r.data };
}
