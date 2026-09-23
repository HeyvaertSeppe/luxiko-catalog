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
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-grey" width={18} height={18} />
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
      <p className="mt-3 text-xs text-grey">{list.length} of {rows.length} products</p>

      <div className="panel mt-2 overflow-hidden">
        <ul className="divide-y divide-line">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-zebra sm:gap-4 sm:px-4">
                <span className="bg-white relative h-12 w-14 shrink-0 overflow-hidden">
                  {r.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-0.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{r.code}</span>
                    {!r.published && (
                      <span className="inline-flex items-center gap-1 bg-zebra px-1.5 py-0.5 text-[10px] font-semibold uppercase text-navy">
                        <EyeOffIcon width={11} height={11} /> Hidden
                      </span>
                    )}
                    {r.needsReview && (
                      <span className="inline-flex items-center gap-1 bg-zebra px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-dark" title="Some specs were cut off in the original PDF">
                        <AlertIcon width={11} height={11} /> Review
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-grey">
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
                        className={`w-10 py-1 text-center text-[10px] font-bold ${has ? "bg-navy text-white" : "bg-zebra text-grey"}`}
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
