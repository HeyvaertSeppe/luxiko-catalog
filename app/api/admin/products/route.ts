import { requireAdminApi } from "@/lib/auth";
import { codeExists, createProduct } from "@/lib/products";
import { parseProduct } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const parsed = parseProduct(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  if (codeExists(parsed.data.code)) return Response.json({ error: "A product with this code already exists" }, { status: 409 });
  const id = createProduct(parsed.data);
  return Response.json({ id });
}
