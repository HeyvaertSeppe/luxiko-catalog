import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { resolveShortSlug } from "@/lib/shortlinks";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const code = /^[A-Za-z0-9]{4,8}$/.test(slug) ? resolveShortSlug(slug) : null;
  return NextResponse.redirect(code ? `${config.siteUrl}/p/${encodeURIComponent(code)}` : `${config.siteUrl}/`, 302);
}
