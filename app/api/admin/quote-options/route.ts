import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { saveQuoteOptions } from "@/lib/quote-options";

const schema = z.object({
  options: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "Options cannot be empty")
          .max(60)
          .refine((v) => !/[\u0000-\u001f\u007f<>]/.test(v), "Invalid characters"),
        enabled: z.boolean(),
      }),
    )
    .max(20),
});

/** Save the "For" options of the quote form. */
export async function PUT(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const seen = new Set<string>();
  for (const o of parsed.data.options) {
    const key = o.label.toLowerCase();
    if (seen.has(key)) return Response.json({ error: `"${o.label}" is listed twice` }, { status: 400 });
    seen.add(key);
  }
  saveQuoteOptions(parsed.data.options);
  return Response.json({ ok: true });
}
