import { requireAdminApi } from "@/lib/auth";
import { isConsoleId } from "@/lib/consoles";
import { getSetting, setSetting } from "@/lib/settings";
import { removeUpload, saveConsoleLogo } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isConsoleId(id)) return Response.json({ error: "Unknown console" }, { status: 400 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received" }, { status: 400 });
  try {
    const name = await saveConsoleLogo(id, file);
    const old = getSetting(`consoleLogo:${id}`);
    setSetting(`consoleLogo:${id}`, name);
    if (old) removeUpload("consoles", old);
  } catch (err) {
    return Response.json({ error: `Could not read image: ${err instanceof Error ? err.message : err}` }, { status: 400 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const old = getSetting(`consoleLogo:${id}`);
  setSetting(`consoleLogo:${id}`, null);
  if (old) removeUpload("consoles", old);
  return Response.json({ ok: true });
}
