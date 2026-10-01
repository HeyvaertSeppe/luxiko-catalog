import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandSlug } from "@/lib/brands";
import { brandSchema } from "@/lib/brand-schema";

/** Add a library brand. */
export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const parsed = brandSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const b = parsed.data;
  const max = (db().prepare("SELECT COALESCE(MAX(sort_order), 0) AS m FROM library_brands").get() as { m: number }).m;
  const res = db()
    .prepare(
      `INSERT INTO library_brands (slug, name, short, hint, accept, color, text_color, enabled, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(brandSlug(b.name), b.name, b.short, b.hint, b.accept, b.color, b.textColor, b.enabled ? 1 : 0, max + 10);
  return Response.json({ id: Number(res.lastInsertRowid) });
}
