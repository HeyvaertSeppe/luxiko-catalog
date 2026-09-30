import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminLogin, getAdminAccount, setAdminPassword } from "@/lib/admin-account";
import { SESSION_COOKIE, createSessionToken, requireAdminApi, sessionCookieOptions } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[A-Za-z0-9._@-]+$/, "Username may only contain letters, numbers and . _ @ -"),
  currentPassword: z.string().min(1, "Enter your current password").max(200),
  newPassword: z.string().min(10, "New password must be at least 10 characters").max(200),
});

/** Change the admin username / password. Signs out every other session. */
export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  if (!rateLimit(`account:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const account = getAdminAccount();
  if (!account || !(await checkAdminLogin(account.username, parsed.data.currentPassword))) {
    return Response.json({ error: "Current password is wrong." }, { status: 400 });
  }
  const version = await setAdminPassword(parsed.data.username, parsed.data.newPassword);
  const res = NextResponse.json({ ok: true });
  if (auth.method === "password") {
    const token = await createSessionToken({ m: "password", u: parsed.data.username, v: version });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req));
  }
  return res;
}
