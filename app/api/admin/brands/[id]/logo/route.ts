import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrand } from "@/lib/brands";
import { removeUpload, saveConsoleLogo } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/** Upload a brand logo (PNG / JPG / WebP / SVG — converted to PNG). */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const brand = getBrand(id);
  if (!brand) return Response.json({ error: "Not found" }, { status: 404 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received" }, { status: 400 });
  try {
    const name = await saveConsoleLogo(brand.slug, file);
    db().prepare("UPDATE library_brands SET logo = ? WHERE id = ?").run(name, id);
    if (brand.logo) removeUpload("consoles", brand.logo);
  } catch (err) {
    return Response.json({ error: `Could not read image: ${err instanceof Error ? err.message : err}` }, { status: 400 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const brand = getBrand(id);
  if (!brand) return Response.json({ error: "Not found" }, { status: 404 });
  db().prepare("UPDATE library_brands SET logo = NULL WHERE id = ?").run(id);
  if (brand.logo) removeUpload("consoles", brand.logo);
  return Response.json({ ok: true });
}
