import { redirectTo } from "@/lib/auth";
import { resolveShortSlug } from "@/lib/shortlinks";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const code = /^[A-Za-z0-9]{4,8}$/.test(slug) ? resolveShortSlug(slug) : null;
  // Relative redirect: works behind any reverse proxy.
  return redirectTo(code ? `/p/${encodeURIComponent(code)}` : "/", 302);
}
