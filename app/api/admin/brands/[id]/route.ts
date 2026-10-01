import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/lib/brands";
import { brandSchema } from "@/lib/brand-schema";
import { removeUpload } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  if (!getBrand(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = brandSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const b = parsed.data;
  db()
    .prepare("UPDATE library_brands SET name = ?, short = ?, hint = ?, accept = ?, color = ?, text_color = ?, enabled = ? WHERE id = ?")
    .run(b.name, b.short, b.hint, b.accept, b.color, b.textColor, b.enabled ? 1 : 0, id);
  return Response.json({ ok: true });
}

/** Delete a brand and every library file uploaded for it. */
export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const brand = getBrand(id);
  if (!brand) return Response.json({ error: "Not found" }, { status: 404 });
  const files = db().prepare("SELECT file FROM library_files WHERE console = ?").all(brand.slug) as { file: string }[];
  db().transaction(() => {
    db().prepare("DELETE FROM library_files WHERE console = ?").run(brand.slug);
    db().prepare("DELETE FROM library_brands WHERE id = ?").run(id);
  })();
  for (const f of files) removeUpload("library", f.file);
  if (brand.logo) removeUpload("consoles", brand.logo);
  return Response.json({ ok: true, removedFiles: files.length });
}
