import { requireAdminApi } from "@/lib/auth";
import { db } from "@/lib/db";

const STATUSES = ["new", "answered", "won", "lost"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!status || !STATUSES.includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  db().prepare("UPDATE quotes SET status = ? WHERE id = ?").run(status, id);
  return Response.json({ ok: true });
}
