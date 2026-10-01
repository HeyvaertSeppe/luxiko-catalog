import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { sectionSchema } from "@/lib/section-schema";

type Ctx = { params: Promise<{ id: string }> };
type Row = { id: number; name: string };

/** Rename / change prefix. Products in the category move along. */
export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const current = db().prepare("SELECT id, name FROM sections WHERE id = ?").get(id) as Row | undefined;
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = sectionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { name, prefix } = parsed.data;
  if (db().prepare("SELECT 1 FROM sections WHERE name = ? COLLATE NOCASE AND id != ?").get(name, id)) {
    return Response.json({ error: "A category with this name already exists" }, { status: 409 });
  }
  db().transaction(() => {
    db().prepare("UPDATE sections SET name = ?, prefix = ? WHERE id = ?").run(name, prefix, id);
    db().prepare("UPDATE products SET section = ? WHERE section = ?").run(name, current.name);
  })();
  return Response.json({ ok: true });
}

/** Delete an empty category. */
export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const current = db().prepare("SELECT id, name FROM sections WHERE id = ?").get(id) as Row | undefined;
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });
  const n = (db().prepare("SELECT COUNT(*) AS n FROM products WHERE section = ?").get(current.name) as { n: number }).n;
  if (n > 0) {
    return Response.json({ error: `Move or delete the ${n} product(s) in "${current.name}" first` }, { status: 409 });
  }
  db().prepare("DELETE FROM sections WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
