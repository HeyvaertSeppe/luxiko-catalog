import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { config } from "@/lib/config";
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  createSessionToken,
  isAllowedAdmin,
  redirectTo,
  sessionCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const clearState = `${STATE_COOKIE}=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax`;

function fail(reason: string) {
  const res = redirectTo(`/admin/login?error=${reason}`, 302);
  res.headers.append("Set-Cookie", clearState);
  return res;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function GET(req: NextRequest) {
  if (!config.googleEnabled) return fail("config");
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const [savedState, verifier] = (req.cookies.get(STATE_COOKIE)?.value ?? "").split(".");
  if (!code || !state || !savedState || !verifier || !safeEqual(state, savedState)) return fail("state");

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
  }).catch(() => null);
  if (!tokenRes?.ok) return fail("google");
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
    m: "google",
    email,
    name: String(claims.name ?? email),
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
  });
  const res = redirectTo("/admin", 302);
  const o = sessionCookieOptions(req);
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${o.maxAge}; HttpOnly; SameSite=Lax${o.secure ? "; Secure" : ""}`,
  );
  res.headers.append("Set-Cookie", clearState);
  return res;
}
