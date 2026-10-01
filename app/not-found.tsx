import Link from "next/link";
import { cookies, headers } from "next/headers";
import { SiteHeader } from "@/components/SiteHeader";
import { getDict, href, isLocale } from "@/lib/i18n";
import { LOCALE_COOKIE, pickLocale } from "@/lib/i18n-config";

export default async function NotFound() {
  const h = await headers();
  const fromPath = h.get("x-lang");
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const lang = isLocale(fromPath) ? fromPath : isLocale(saved) ? saved : pickLocale(h.get("accept-language"));
  const t = getDict(lang).notFound;
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto flex min-h-[70dvh] max-w-6xl flex-col justify-center px-4 sm:px-6">
        <p className="caps text-sm text-navy">404</p>
        <h1 className="mt-3 text-5xl tracking-tight text-ink">{t.title}</h1>
        <p className="mt-3 text-navy">{t.body}</p>
        <Link href={href(lang)} className="btn-primary mt-8 self-start">{t.cta}</Link>
      </main>
    </>
  );
}
