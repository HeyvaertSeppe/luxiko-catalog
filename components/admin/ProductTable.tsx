"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CONSOLES, type ConsoleId } from "@/lib/consoles";
import { AlertIcon, EyeOffIcon, SearchIcon } from "../icons";

export type AdminRow = {
  id: number;
  code: string;
  name: string;
  section: string;
  series: string | null;
  ip: string;
  image: string | null;
  imageCount: number;
  libraries: ConsoleId[];
  published: boolean;
  needsReview: boolean;
  updatedAt: string;
};

const SHORT: Record<ConsoleId, string> = { grandma2: "MA2", grandma3: "MA3", chamsys: "MQ", avolites: "AVO" };

export function ProductTable({ rows, sections }: { rows: AdminRow[]; sections: string[] }) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [filter, setFilter] = useState<"" | "review" | "hidden" | "nolib">("");

  const list = useMemo(() => {
    const nq = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (section && r.section !== section) return false;
      if (filter === "review" && !r.needsReview) return false;
      if (filter === "hidden" && r.published) return false;
      if (filter === "nolib" && r.libraries.length > 0) return false;
      return !nq || `${r.code} ${r.name}`.toLowerCase().includes(nq);
    });
  }, [rows, q, section, filter]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-2 md:flex-row">
        <label className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" width={18} height={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or name…" className="field pl-10" />
        </label>
        <select value={section} onChange={(e) => setSection(e.target.value)} className="field md:w-56">
          <option value="">All categories</option>
          {sections.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="field md:w-52">
          <option value="">All products</option>
          <option value="review">Needs review</option>
          <option value="hidden">Hidden</option>
          <option value="nolib">No library files</option>
        </select>
      </div>
      <p className="mt-3 text-xs text-navy-300">{list.length} of {rows.length} products</p>

      <div className="card mt-2 overflow-hidden">
        <ul className="divide-y divide-white/5">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/[0.03] sm:gap-4 sm:px-4">
                <span className="product-stage relative h-12 w-14 shrink-0 overflow-hidden rounded-lg">
                  {r.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-0.5 mix-blend-multiply" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-sm font-semibold text-white">{r.code}</span>
                    {!r.published && (
                      <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-navy-200">
                        <EyeOffIcon width={11} height={11} /> Hidden
                      </span>
                    )}
                    {r.needsReview && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-brand" title="Some specs were cut off in the original PDF">
                        <AlertIcon width={11} height={11} /> Review
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-navy-300">
                    {r.name} · {r.section} · {r.ip}
                  </span>
                </span>
                <span className="hidden shrink-0 gap-1 sm:flex">
                  {CONSOLES.map((c) => {
                    const has = r.libraries.includes(c.id);
                    return (
                      <span
                        key={c.id}
                        title={`${c.name}: ${has ? "uploaded" : "no file"}`}
                        className={`w-10 rounded-md py-1 text-center text-[10px] font-bold ${has ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.03] text-navy-500"}`}
                      >
                        {SHORT[c.id]}
                      </span>
                    );
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
