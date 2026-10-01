/** Website languages. Kept dependency-free: also used by middleware. */
export const LOCALES = ["en", "nl", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Used when the visitor's device language is none of the above. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "lx_lang";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  fr: "Français",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/**
 * Best website language for an Accept-Language header,
 * e.g. "nl-BE,nl;q=0.9,en;q=0.8" → "nl", "fr-FR" → "fr", "de-DE" → "en".
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const match = ranked.find((x) => isLocale(x.lang));
  return match ? (match.lang as Locale) : DEFAULT_LOCALE;
}
