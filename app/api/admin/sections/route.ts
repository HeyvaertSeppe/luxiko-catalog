import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";
import { sectionSchema } from "@/lib/section-schema";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const parsed = sectionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (db().prepare("SELECT 1 FROM sections WHERE name = ? COLLATE NOCASE").get(parsed.data.name)) {
    return Response.json({ error: "A category with this name already exists" }, { status: 409 });
  }
  const max = (db().prepare("SELECT COALESCE(MAX(sort_order), 0) AS m FROM sections").get() as { m: number }).m;
  const res = db()
    .prepare("INSERT INTO sections (name, prefix, sort_order) VALUES (?, ?, ?)")
    .run(parsed.data.name, parsed.data.prefix, max + 10);
  return Response.json({ id: Number(res.lastInsertRowid) });
}
