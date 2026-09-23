import { requireAdminApi } from "@/lib/auth";
import { isConsoleId } from "@/lib/consoles";
import { db } from "@/lib/db";
import { getProductById, touchProduct } from "@/lib/products";
import { removeUpload, saveLibrary } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/** Upload / replace the library file for one console (multipart: console, file). */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  if (!getProductById(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const form = await req.formData();
  const consoleId = String(form.get("console") ?? "");
  const file = form.get("file");
  if (!isConsoleId(consoleId)) return Response.json({ error: "Unknown console" }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "No file received" }, { status: 400 });

  let saved;
  try {
    saved = await saveLibrary(file);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
  const old = db().prepare("SELECT file FROM library_files WHERE product_id = ? AND console = ?").get(id, consoleId) as
    | { file: string }
    | undefined;
  db()
    .prepare(
      `INSERT INTO library_files (product_id, console, file, original_name, size) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(product_id, console) DO UPDATE SET file = excluded.file, original_name = excluded.original_name,
       size = excluded.size, uploaded_at = datetime('now')`,
    )
    .run(id, consoleId, saved.file, saved.originalName, saved.size);
  if (old) removeUpload("library", old.file);
  touchProduct(id);
  return Response.json({ product: getProductById(id) });
}

/** Remove a console's file — its download button disappears from the website. */
export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const consoleId = new URL(req.url).searchParams.get("console") ?? "";
  const row = db().prepare("SELECT file FROM library_files WHERE product_id = ? AND console = ?").get(id, consoleId) as
    | { file: string }
    | undefined;
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  db().prepare("DELETE FROM library_files WHERE product_id = ? AND console = ?").run(id, consoleId);
  removeUpload("library", row.file);
  touchProduct(id);
  return Response.json({ product: getProductById(id) });
}
