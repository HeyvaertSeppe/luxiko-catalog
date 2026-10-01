"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Brand } from "@/lib/brands";
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from "../icons";

type Row = Brand & { files: number };
type Draft = { name: string; short: string; hint: string; accept: string; color: string; textColor: string; enabled: boolean };

const toDraft = (b: Row): Draft => ({
  name: b.name,
  short: b.short,
  hint: b.hint,
  accept: b.accept,
  color: b.color,
  textColor: b.textColor,
  enabled: b.enabled,
});

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData || body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);
  const json = (res ? await res.json().catch(() => ({})) : {}) as { error?: string };
  if (!res?.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

function Preview({ d, logoUrl }: { d: Draft; logoUrl: string | null }) {
  return (
    <div style={{ backgroundColor: d.color, color: d.textColor }} className="flex items-center gap-3 p-3">
      <span className="flex h-12 w-16 shrink-0 items-center justify-center bg-white p-1.5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-label text-lg font-bold" style={{ color: d.color }}>
            {d.short || d.name.slice(0, 3).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{d.name || "Brand name"}</span>
        <span className="block truncate text-sm opacity-80">fixture-library{(d.accept.split(",")[0] || ".zip").trim()} · 24 KB</span>
      </span>
      <DownloadIcon width={18} height={18} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer border border-line bg-white p-0.5" aria-label={label} />
        <input className="field font-mono" value={value} maxLength={7} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function BrandCard({ b, first, last, onMove }: { b: Row; first: boolean; last: boolean; onMove: (d: number) => void }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(toDraft(b));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(toDraft(b));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD({ ...d, [k]: v });

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="panel">
      <div className="bar flex items-center gap-3">
        <span className="flex-1 truncate">{b.name}</span>
        {!b.enabled && <span className="bg-white/20 px-2 text-[10px]">Off</span>}
        <span className="normal-case tracking-normal opacity-80">{b.files} file{b.files === 1 ? "" : "s"}</span>
        <button type="button" disabled={first} onClick={() => onMove(-1)} className="cursor-pointer disabled:opacity-30" aria-label="Move up">
          <ChevronUpIcon width={16} height={16} />
        </button>
        <button type="button" disabled={last} onClick={() => onMove(1)} className="cursor-pointer disabled:opacity-30" aria-label="Move down">
          <ChevronDownIcon width={16} height={16} />
        </button>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Name</label>
            <input className="field" value={d.name} maxLength={60} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Short label (badges)</label>
            <input className="field" value={d.short} maxLength={6} placeholder="MA3" onChange={(e) => set("short", e.target.value)} />
          </div>
          <ColorField label="Button colour" value={d.color} onChange={(v) => set("color", v)} />
          <ColorField label="Text colour" value={d.textColor} onChange={(v) => set("textColor", v)} />
          <div>
            <label className="field-label">Allowed file types</label>
            <input className="field font-mono" value={d.accept} placeholder=".xml, .zip (empty = any)" onChange={(e) => set("accept", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Hint in admin</label>
            <input className="field" value={d.hint} maxLength={80} placeholder="Fixture type (.xml)" onChange={(e) => set("hint", e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy sm:col-span-2">
            <input type="checkbox" checked={d.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-[#202a4b]" />
            Show this brand&apos;s download buttons on the website
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button type="button" disabled={!dirty || busy} className="btn-primary cursor-pointer" onClick={() => run(() => send(`/api/admin/brands/${b.id}`, "PUT", d), "Saved")}>
              Save brand
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn-danger cursor-pointer"
              onClick={() => {
                const warn = b.files ? `\n\nThis also deletes ${b.files} uploaded library file(s).` : "";
                if (confirm(`Delete the brand "${b.name}"?${warn}`)) run(() => send(`/api/admin/brands/${b.id}`, "DELETE"), "Deleted");
              }}
            >
              <TrashIcon width={16} height={16} /> Delete
            </button>
            {msg && <span className={`text-sm ${msg.ok ? "text-ok" : "text-danger"}`}>{msg.text}</span>}
          </div>
        </div>
        <div>
          <span className="field-label">Preview on the website</span>
          <Preview d={d} logoUrl={b.logoUrl} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className={`btn-secondary cursor-pointer px-3 py-2 text-xs ${busy ? "pointer-events-none opacity-50" : ""}`}>
              <UploadIcon width={14} height={14} /> {b.logoUrl ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const body = new FormData();
                  body.append("file", f);
                  run(() => send(`/api/admin/brands/${b.id}/logo`, "POST", body), "Logo uploaded");
                }}
              />
            </label>
            {b.logoUrl && (
              <button type="button" className="cursor-pointer text-xs text-danger underline" onClick={() => run(() => send(`/api/admin/brands/${b.id}/logo`, "DELETE"), "Logo removed")}>
                Remove logo
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-grey">PNG, SVG, JPG or WebP. Shown on a white tile; transparent background works best.</p>
        </div>
      </div>
    </li>
  );
}

export function BrandsManager({ brands }: { brands: Row[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ name: "", short: "", hint: "", accept: ".zip", color: "#202a4b", textColor: "#ffffff", enabled: true });
  const [error, setError] = useState<string | null>(null);

  async function move(i: number, dir: number) {
    const ids = brands.map((b) => b.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    await send("/api/admin/brands/order", "PUT", { order: ids }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <ul className="space-y-6">
        {brands.map((b, i) => (
          <BrandCard key={`${b.id}-${b.name}-${b.color}-${b.textColor}-${b.enabled}-${b.logoUrl}`} b={b} first={i === 0} last={i === brands.length - 1} onMove={(d) => move(i, d)} />
        ))}
      </ul>
      <section className="panel">
        <div className="bar">Add a brand</div>
        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="field-label">Name</label>
            <input className="field" value={draft.name} maxLength={60} placeholder="e.g. Onyx (Obsidian)" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Short label</label>
            <input className="field" value={draft.short} maxLength={6} placeholder="ONYX" onChange={(e) => setDraft({ ...draft, short: e.target.value })} />
          </div>
          <ColorField label="Button colour" value={draft.color} onChange={(v) => setDraft({ ...draft, color: v })} />
          <div className="sm:col-span-4">
            <button
              type="button"
              className="btn-primary cursor-pointer"
              onClick={async () => {
                setError(null);
                try {
                  await send("/api/admin/brands", "POST", draft);
                  setDraft({ ...draft, name: "", short: "" });
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              <PlusIcon width={16} height={16} /> Add brand
            </button>
            {error && <span className="ml-3 text-sm text-danger">{error}</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
