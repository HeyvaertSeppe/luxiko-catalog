import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { codeExists, getProductById, updateProduct } from "@/lib/products";
import { removeUpload } from "@/lib/storage";
import { parseProduct } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  if (!getProductById(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = parseProduct(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  if (codeExists(parsed.data.code, id)) return Response.json({ error: "Another product already uses this code" }, { status: 409 });
  updateProduct(id, parsed.data);
  return Response.json({ product: getProductById(id) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const product = getProductById(id);
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });
  const libFiles = db().prepare("SELECT file FROM library_files WHERE product_id = ?").all(id) as { file: string }[];
  db().prepare("DELETE FROM products WHERE id = ?").run(id);
  for (const img of product.images) removeUpload("images", img.file);
  for (const l of libFiles) removeUpload("library", l.file);
  return Response.json({ ok: true });
}
