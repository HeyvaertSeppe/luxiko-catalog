"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import { fmt } from "@/lib/i18n";
import { SearchIcon } from "./icons";

export type CatalogItem = {
  code: string;
  name: string;
  section: string;
  series: "B" | "S" | "P" | null;
  ip: string;
  image: string | null;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`caps shrink-0 cursor-pointer border-b-2 pb-1 text-[11px] transition-colors ${
        active ? "border-orange text-navy" : "border-transparent text-grey hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

export function CatalogBrowser({
  items,
  sections,
  lang,
  t,
  series: seriesNames,
}: {
  items: CatalogItem[];
  sections: { name: string; label: string; count: number }[];
  lang: Locale;
  t: Dict["browser"];
  series: Record<"B" | "S" | "P", string>;
}) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | null>(null);
  const [series, setSeries] = useState<string | null>(null);
  const [outdoor, setOutdoor] = useState(false);
  const q = useDeferredValue(query);
  const labelOf = useMemo(() => new Map(sections.map((s) => [s.name, s.label])), [sections]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return items.filter((i) => {
      if (section && i.section !== section) return false;
      if (series && i.series !== series) return false;
      if (outdoor && !/IP5|IP6|OUTDOOR/.test(i.ip)) return false;
      return !nq || normalize(`${i.code} ${i.name} ${i.section} ${labelOf.get(i.section) ?? ""} ${i.ip}`).includes(nq);
    });
  }, [items, q, section, series, outdoor, labelOf]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const i of filtered) {
      if (!map.has(i.section)) map.set(i.section, []);
      map.get(i.section)!.push(i);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      <div className="sticky top-16 z-30 border-y border-line bg-white py-4 sm:top-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{t.search}</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grey" width={18} height={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="field h-11 pl-10 text-base"
              inputMode="search"
            />
          </label>
          <div className="flex items-center gap-5 overflow-x-auto">
            {(["B", "S", "P"] as const).map((id) => (
              <Filter key={id} active={series === id} onClick={() => setSeries(series === id ? null : id)}>
                {seriesNames[id]}
              </Filter>
            ))}
            <Filter active={outdoor} onClick={() => setOutdoor(!outdoor)}>
              {t.outdoor}
            </Filter>
          </div>
        </div>
        <nav className="mt-4 flex gap-5 overflow-x-auto [scrollbar-width:none]" aria-label={t.sections}>
          <Filter active={!section} onClick={() => setSection(null)}>
            {t.all}
          </Filter>
          {sections.map((s) => (
            <Filter key={s.name} active={section === s.name} onClick={() => setSection(section === s.name ? null : s.name)}>
              {s.label}
            </Filter>
          ))}
        </nav>
      </div>

      {grouped.length === 0 && <p className="py-16 text-center text-grey">{t.noResults}</p>}

      {grouped.map(([name, list]) => (
        <section key={name} className="mt-12">
          <div className="border-b border-navy pb-3">
            <h2 className="text-4xl tracking-tight text-ink sm:text-5xl">{labelOf.get(name) ?? name}</h2>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange">{list.length}</span>
              <span className="caps text-sm text-navy">{list.length === 1 ? t.fixture : t.fixtures}</span>
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.code} className="border-b border-line">
                <Link href={`/${lang}/p/${encodeURIComponent(p.code)}`} className="group flex items-center gap-4 py-4 pr-2">
                  <span className="flex h-20 w-28 shrink-0 items-center justify-center bg-white">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={`${p.code} ${p.name}`} loading="lazy" className="max-h-20 max-w-28 object-contain" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xl text-ink group-hover:underline">{p.code}</span>
                    <span className="block truncate font-bold text-orange">{p.name}</span>
                    <span className="block text-xs text-grey">
                      {p.series ? `${fmt(t.seriesLine, { name: seriesNames[p.series] })} · ` : ""}
                      {p.ip}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
