import Link from "next/link";
import { getDict, href, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader({ lang, children }: { lang: Locale; children?: React.ReactNode }) {
  const t = getDict(lang);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Link href={href(lang)} className="flex shrink-0 items-center" aria-label={t.header.home}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.png" alt="LUXIKO · Betaalbaar licht & geluid" className="h-9 w-auto sm:h-11" />
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          {children}
          <LanguageSwitcher current={lang} label={t.header.language} />
        </div>
      </div>
    </header>
  );
}
