import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { STATE_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

/** Starts Google sign-in (OAuth 2.0 authorization code flow with PKCE). */
export async function GET() {
  if (!config.googleClientId || !config.googleClientSecret) {
    return NextResponse.redirect(`${config.siteUrl}/admin/login?error=config`);
  }
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());

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
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 600,
  });
  return res;
}
