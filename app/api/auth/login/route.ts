import { z } from "zod";
import { checkAdminLogin } from "@/lib/admin-account";
import { SESSION_COOKIE, createSessionToken, sameOrigin, sessionCookieOptions } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Cross-site request blocked" }, { status: 403 });
  // 10 attempts per 15 minutes per IP address.
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  }
  // Plus a global cap, against guessing from many addresses at once.
  if (!rateLimit("login:all", 100, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter your username and password." }, { status: 400 });

  const account = await checkAdminLogin(parsed.data.username, parsed.data.password);
  if (!account) return Response.json({ error: "Wrong username or password." }, { status: 401 });

  const token = await createSessionToken({ m: "password", u: account.username, v: account.version });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req));
  return res;
}
