"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { SearchIcon, XIcon } from "./icons";

export type CatalogItem = {
  code: string;
  name: string;
  section: string;
  series: "B" | "S" | "P" | null;
  ip: string;
  image: string | null;
  libraries: number;
};

const SERIES = [
  { id: "B", label: "Budget" },
  { id: "S", label: "Standard" },
  { id: "P", label: "Premium" },
] as const;

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function CatalogBrowser({
  items,
  sections,
}: {
  items: CatalogItem[];
  sections: { name: string; prefix: string; count: number }[];
}) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | null>(null);
  const [series, setSeries] = useState<string | null>(null);
  const [outdoor, setOutdoor] = useState(false);
  const q = useDeferredValue(query);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return items.filter((i) => {
      if (section && i.section !== section) return false;
      if (series && i.series !== series) return false;
      if (outdoor && !/IP5|IP6|OUTDOOR/.test(i.ip)) return false;
      if (!nq) return true;
      return normalize(`${i.code} ${i.name} ${i.section} ${i.ip}`).includes(nq);
    });
  }, [items, q, section, series, outdoor]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const i of filtered) {
      if (!map.has(i.section)) map.set(i.section, []);
      map.get(i.section)!.push(i);
    }
    return [...map.entries()];
  }, [filtered]);

  const active = Boolean(query || section || series || outdoor);

  return (
    <div className="-mt-6 sm:-mt-8">
      <div className="sticky top-16 z-30 -mx-4 bg-navy-950/85 px-4 pb-3 pt-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code, type or wattage — e.g. MVS720, beam, IP65"
              className="field h-12 rounded-2xl pl-11 text-base"
              inputMode="search"
            />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {SERIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeries(series === s.id ? null : s.id)}
                className={`chip shrink-0 cursor-pointer py-2 transition ${series === s.id ? "border-amber-brand bg-amber-brand text-navy-950" : "hover:border-white/25"}`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setOutdoor(!outdoor)}
              className={`chip shrink-0 cursor-pointer py-2 transition ${outdoor ? "border-amber-brand bg-amber-brand text-navy-950" : "hover:border-white/25"}`}
            >
              Outdoor (IP54+)
            </button>
            {active && (
              <button
                onClick={() => {
                  setQuery("");
                  setSection(null);
                  setSeries(null);
                  setOutdoor(false);
                }}
                className="chip shrink-0 cursor-pointer py-2 text-navy-300 hover:text-white"
              >
                <XIcon width={14} height={14} /> Clear
              </button>
            )}
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Categories">
          <button
            onClick={() => setSection(null)}
            className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${!section ? "bg-white text-navy-950" : "text-navy-300 hover:bg-white/5 hover:text-white"}`}
          >
            All <span className="opacity-60">{items.length}</span>
          </button>
          {sections.map((s) => (
            <button
              key={s.name}
              onClick={() => setSection(section === s.name ? null : s.name)}
              className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${section === s.name ? "bg-white text-navy-950" : "text-navy-300 hover:bg-white/5 hover:text-white"}`}
            >
              {s.name} <span className="opacity-60">{s.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {grouped.length === 0 && (
        <div className="card mt-10 p-10 text-center text-navy-300">
          No products match your search.
        </div>
      )}

      {grouped.map(([name, list]) => (
        <section key={name} className="mt-10">
          <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-white/5 pb-3">
            <h2 className="font-display text-2xl font-semibold text-white">{name}</h2>
            <span className="text-sm text-navy-300">{list.length} fixtures</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((p) => (
              <Link
                key={p.code}
                href={`/p/${encodeURIComponent(p.code)}`}
                className="group card overflow-hidden transition hover:-translate-y-0.5 hover:border-amber-brand/40 hover:shadow-[0_20px_50px_-20px_rgba(242,174,28,0.35)]"
              >
                <div className="product-stage relative aspect-[4/3]">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={`${p.code} ${p.name}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-md bg-navy-950/85 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-brand">
                    {p.ip}
                  </span>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="truncate font-display text-[15px] font-semibold text-white">{p.code}</div>
                  <div className="mt-0.5 truncate text-xs font-semibold uppercase tracking-wide text-amber-brand">
                    {p.name}
                  </div>
                  {p.series && (
                    <div className="mt-2 text-[11px] text-navy-300">
                      {SERIES.find((s) => s.id === p.series)?.label} series
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
