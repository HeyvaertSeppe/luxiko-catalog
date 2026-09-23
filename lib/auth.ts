import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";

export const SESSION_COOKIE = "lx_session";
export const STATE_COOKIE = "lx_oauth";
const SESSION_DAYS = 7;

export type Session = { email: string; name: string; picture?: string };

function secretKey() {
  const s = config.authSecret;
  if (s.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. Set it in .env.local");
  }
  return new TextEncoder().encode(s);
}

export function isAllowedAdmin(email: string) {
  return config.adminEmails.includes(email.trim().toLowerCase());
}

export async function createSessionToken(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token || config.authSecret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const email = String(payload.email ?? "");
    // Re-check the allow list on every request, so removing someone from
    // ADMIN_EMAILS locks them out immediately.
    if (!email || !isAllowedAdmin(email)) return null;
    return { email, name: String(payload.name ?? email), picture: payload.picture as string | undefined };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

/** For admin pages: sends visitors without a valid session to the login page. */
export async function requireAdminPage(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * For admin API routes: returns the session, or a Response to send back.
 * Also blocks cross-site requests (CSRF) by checking the Origin header.
 */
export async function requireAdminApi(req: Request): Promise<Session | Response> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return Response.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
  }
  const session = await getSession();
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 });
  return session;
}
