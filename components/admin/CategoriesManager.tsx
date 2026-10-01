"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from "../icons";

type Row = { id: number; name: string; prefix: string; products: number };

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  const json = (res ? await res.json().catch(() => ({})) : {}) as { error?: string };
  if (!res?.ok) throw new Error(json.error ?? "Request failed");
}

function CategoryRow({ s, i, count, onMove }: { s: Row; i: number; count: number; onMove: (d: number) => void }) {
  const router = useRouter();
  const [name, setName] = useState(s.name);
  const [prefix, setPrefix] = useState(s.prefix);
  const [error, setError] = useState<string | null>(null);
  const dirty = name !== s.name || prefix !== s.prefix;

  async function run(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <li className={`flex flex-wrap items-center gap-2 px-3 py-2 ${i % 2 ? "bg-zebra" : ""}`}>
      <input className="field w-20 shrink-0 font-bold uppercase text-orange-dark" value={prefix} maxLength={4} aria-label="Code prefix" onChange={(e) => setPrefix(e.target.value)} />
      <input className="field min-w-0 flex-1 font-bold text-navy" value={name} maxLength={60} aria-label="Name" onChange={(e) => setName(e.target.value)} />
      <span className="w-24 shrink-0 text-right text-sm text-grey">{s.products} product{s.products === 1 ? "" : "s"}</span>
      {dirty && (
        <button type="button" className="btn-primary cursor-pointer px-3 py-2" onClick={() => run(() => send(`/api/admin/sections/${s.id}`, "PUT", { name, prefix }))}>
          Save
        </button>
      )}
      <div className="flex shrink-0 flex-col">
        <button type="button" disabled={i === 0} onClick={() => onMove(-1)} className="cursor-pointer text-grey hover:text-navy disabled:opacity-20" aria-label="Move up">
          <ChevronUpIcon width={16} height={16} />
        </button>
        <button type="button" disabled={i === count - 1} onClick={() => onMove(1)} className="cursor-pointer text-grey hover:text-navy disabled:opacity-20" aria-label="Move down">
          <ChevronDownIcon width={16} height={16} />
        </button>
      </div>
      <button
        type="button"
        disabled={s.products > 0}
        title={s.products > 0 ? "Only empty categories can be deleted" : "Delete"}
        className="cursor-pointer p-2 text-grey hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => confirm(`Delete "${s.name}"?`) && run(() => send(`/api/admin/sections/${s.id}`, "DELETE"))}
        aria-label={`Delete ${s.name}`}
      >
        <TrashIcon width={16} height={16} />
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </li>
  );
}

export function CategoriesManager({ sections }: { sections: Row[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function move(i: number, d: number) {
    const ids = sections.map((s) => s.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    await send("/api/admin/sections/order", "PUT", { order: ids }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="mt-6 max-w-3xl">
      <div className="bar flex gap-2">
        <span className="w-20">Code</span>
        <span className="flex-1">Category</span>
      </div>
      <ul>
        {sections.map((s, i) => (
          <CategoryRow key={`${s.id}-${s.name}-${s.prefix}`} s={s} i={i} count={sections.length} onMove={(d) => move(i, d)} />
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <input className="field w-20 uppercase" placeholder="XX" maxLength={4} value={prefix} onChange={(e) => setPrefix(e.target.value)} aria-label="New code prefix" />
        <input className="field min-w-0 flex-1" placeholder="New category, e.g. Hazers" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} aria-label="New category name" />
        <button
          type="button"
          className="btn-primary cursor-pointer"
          onClick={async () => {
            setError(null);
            try {
              await send("/api/admin/sections", "POST", { name, prefix });
              setName("");
              setPrefix("");
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          <PlusIcon width={16} height={16} /> Add category
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
