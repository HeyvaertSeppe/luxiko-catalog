import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";
import { getAdminAccount } from "./admin-account";

export const SESSION_COOKIE = "lx_session";
export const STATE_COOKIE = "lx_oauth";
const SESSION_DAYS = 7;

export type Session = { name: string; email?: string; picture?: string; method: "password" | "google" };

function secretKey() {
  const s = config.authSecret;
  if (s.length < 32) throw new Error("AUTH_SECRET missing — it is generated automatically on first start.");
  return new TextEncoder().encode(s);
}

export function isAllowedAdmin(email: string) {
  return config.adminEmails.includes(email.trim().toLowerCase());
}

export async function createSessionToken(
  payload: { m: "password"; u: string; v: number } | { m: "google"; email: string; name: string; picture?: string },
) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

/**
 * True when the visitor uses HTTPS — directly or through a reverse proxy
 * (X-Forwarded-Proto). Cookies are only marked Secure then, so logging in
 * over plain http://server:3000 still works.
 */
export function isHttps(req: Request) {
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto) return proto === "https";
  return new URL(req.url).protocol === "https:";
}

export function sessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps(req),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token || config.authSecret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.m === "password") {
      // Changing the password bumps the version, which signs out old sessions.
      const account = getAdminAccount();
      if (!account || payload.u !== account.username || payload.v !== account.version) return null;
      return { name: account.username, method: "password" };
    }
    if (payload.m === "google") {
      const email = String(payload.email ?? "");
      // Re-check the allow-list on every request.
      if (!email || !config.googleEnabled || !isAllowedAdmin(email)) return null;
      return {
        name: String(payload.name ?? email),
        email,
        picture: typeof payload.picture === "string" ? payload.picture : undefined,
        method: "google",
      };
    }
    return null;
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

/** Hosts this site is reachable on: the request host, the proxy's forwarded host and SITE_URL. */
function allowedHosts(req: Request) {
  const hosts = new Set<string>();
  const add = (h: string | null | undefined) => h && hosts.add(h.split(",")[0].trim().toLowerCase());
  add(req.headers.get("host"));
  add(req.headers.get("x-forwarded-host"));
  try {
    add(new URL(config.siteUrl).host);
  } catch {}
  return hosts;
}

/** Blocks cross-site form posts / fetches (CSRF) by checking Origin / Referer. */
export function sameOrigin(req: Request) {
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source || source === "null") return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return allowedHosts(req).has(new URL(source).host.toLowerCase());
  } catch {
    return false;
  }
}

/** For admin API routes: returns the session, or a Response to send back. */
export async function requireAdminApi(req: Request): Promise<Session | Response> {
  if (req.method !== "GET" && req.method !== "HEAD" && !sameOrigin(req)) {
    return Response.json({ error: "Cross-site request blocked" }, { status: 403 });
  }
  const session = await getSession();
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 });
  return session;
}

/** Relative redirect — works behind any reverse proxy without knowing the public URL. */
export function redirectTo(location: string, status = 303) {
  return new Response(null, { status, headers: { Location: location } });
}
