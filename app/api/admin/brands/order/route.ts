import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";

/** Reorder brands: { order: [id, id, …] } */
export async function PUT(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const { order } = (await req.json().catch(() => ({}))) as { order?: unknown };
  if (!Array.isArray(order) || !order.every((n) => Number.isInteger(n))) {
    return Response.json({ error: "Invalid order" }, { status: 400 });
  }
  const stmt = db().prepare("UPDATE library_brands SET sort_order = ? WHERE id = ?");
  db().transaction(() => order.forEach((id, i) => stmt.run((i + 1) * 10, id)))();
  return Response.json({ ok: true });
}
