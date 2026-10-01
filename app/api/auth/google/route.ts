import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { STATE_COOKIE, isHttps, redirectTo } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Starts Google sign-in (OAuth 2.0 authorization code flow with PKCE). */
export async function GET(req: Request) {
  if (!config.googleEnabled) return redirectTo("/admin/login?error=config", 302);
  const state = crypto.randomBytes(24).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.googleClientId);
  url.searchParams.set("redirect_uri", `${config.siteUrl}/api/auth/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set(STATE_COOKIE, `${state}.${verifier}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(req),
    path: "/api/auth",
    maxAge: 600,
  });
  return res;
}
