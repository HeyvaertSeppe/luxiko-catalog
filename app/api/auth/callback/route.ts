import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { config } from "@/lib/config";
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  createSessionToken,
  isAllowedAdmin,
  sessionCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

function fail(reason: string) {
  const res = NextResponse.redirect(`${config.siteUrl}/admin/login?error=${reason}`);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
  return res;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const [savedState, verifier] = (req.cookies.get(STATE_COOKIE)?.value ?? "").split(".");
  if (!code || !state || !savedState || !verifier || !safeEqual(state, savedState)) {
    return fail("state");
  }

  // Exchange the one-time code for tokens directly with Google (server to server).
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: `${config.siteUrl}/api/auth/callback`,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) return fail("google");
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return fail("google");

  // The ID token came straight from Google's token endpoint over TLS, so its
  // claims can be trusted without re-verifying the signature (OIDC Core 3.1.3.7).
  const claims = decodeJwt(tokens.id_token);
  const email = String(claims.email ?? "").toLowerCase();
  const validIssuer = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!validIssuer || claims.aud !== config.googleClientId || claims.email_verified !== true || !email) {
    return fail("google");
  }
  if (!isAllowedAdmin(email)) return fail("denied");

  const token = await createSessionToken({
    email,
    name: String(claims.name ?? email),
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
  });
  const res = NextResponse.redirect(`${config.siteUrl}/admin`);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
  return res;
}
