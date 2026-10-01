"use client";

import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/lib/i18n-config";

/** EN · NL · FR — keeps you on the same page and remembers the choice. */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() || "/";
  const rest = pathname.replace(/^\/(en|nl|fr)(?=\/|$)/, "");

  return (
    <nav aria-label={label} className="flex items-center">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1.5 text-line" aria-hidden>|</span>}
          <a
            href={`/${l}${rest}`}
            hrefLang={l}
            lang={l}
            title={LOCALE_NAMES[l]}
            aria-current={l === current ? "true" : undefined}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={`caps border-b-2 pb-0.5 text-[11px] transition-colors ${
              l === current ? "border-orange text-navy" : "border-transparent text-grey hover:text-navy"
            }`}
          >
            {l.toUpperCase()}
          </a>
        </span>
      ))}
    </nav>
  );
}
