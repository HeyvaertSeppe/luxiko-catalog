import { config } from "@/lib/config";
import { getProductByCode } from "@/lib/products";
import { getOrCreateShortSlug } from "@/lib/shortlinks";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`share:${clientIp(req)}`, 30, 60 * 1000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const product = typeof code === "string" ? getProductByCode(code) : null;
  if (!product) return Response.json({ error: "Unknown product" }, { status: 404 });
  const slug = getOrCreateShortSlug(product.id);
  const url = `${config.siteUrl}/s/${slug}`;
  return Response.json({ url, display: url.replace(/^https?:\/\//, "") });
}
