import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, pickLocale } from "./lib/i18n-config";

/**
 * Website languages: /en/…, /nl/…, /fr/…
 *
 * A link without a language (QR codes in the PDF point to /p/<code>, short
 * links, the home page) is sent to the visitor's language: the one they
 * picked with the language switcher (cookie), otherwise their device /
 * browser language, otherwise English.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first)) {
    // Pass the language on, so the root layout can set <html lang>.
    const headers = new Headers(req.headers);
    headers.set("x-lang", first);
    return NextResponse.next({ request: { headers } });
  }

  // Plain files (robots.txt, favicon.ico …) are not pages.
  if (/\.[a-z0-9]+$/i.test(pathname) && !pathname.startsWith("/p/")) return NextResponse.next();

  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : pickLocale(req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  // Same-origin redirects are sent as a relative Location by Next.js, so this
  // works behind any reverse proxy.
  const res = NextResponse.redirect(url, 307);
  // Depends on the visitor: never cache (important behind Cloudflare).
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

export const config = {
  // Everything except the app's own files, API, admin and short links.
  matcher: ["/((?!api/|_next/|files/|brand/|admin|s/).*)"],
};
