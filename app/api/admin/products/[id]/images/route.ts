import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProductById, touchProduct } from "@/lib/products";
import { removeUpload, saveImage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/** Upload one or more photos (multipart field "files"). */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  if (!getProductById(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return Response.json({ error: "No files received" }, { status: 400 });

  const max = (db().prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM product_images WHERE product_id = ?").get(id) as { m: number }).m;
  let order = max + 1;
  try {
    for (const f of files) {
      const saved = await saveImage(f);
      db()
        .prepare("INSERT INTO product_images (product_id, file, width, height, sort_order) VALUES (?, ?, ?, ?, ?)")
        .run(id, saved.file, saved.width, saved.height, order++);
    }
  } catch (err) {
    return Response.json({ error: `Could not read image: ${err instanceof Error ? err.message : err}` }, { status: 400 });
  }
  touchProduct(id);
  return Response.json({ product: getProductById(id) });
}

/** Reorder photos: { order: [imageId, ...] } — the first one is the main photo. */
export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const { order } = (await req.json().catch(() => ({}))) as { order?: number[] };
  if (!Array.isArray(order)) return Response.json({ error: "Missing order" }, { status: 400 });
  const stmt = db().prepare("UPDATE product_images SET sort_order = ? WHERE id = ? AND product_id = ?");
  db().transaction(() => order.forEach((imageId, i) => stmt.run(i, Number(imageId), id)))();
  touchProduct(id);
  return Response.json({ product: getProductById(id) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const imageId = Number(new URL(req.url).searchParams.get("imageId"));
  const row = db().prepare("SELECT file FROM product_images WHERE id = ? AND product_id = ?").get(imageId, id) as
    | { file: string }
    | undefined;
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  db().prepare("DELETE FROM product_images WHERE id = ?").run(imageId);
  removeUpload("images", row.file);
  touchProduct(id);
  return Response.json({ product: getProductById(id) });
}
