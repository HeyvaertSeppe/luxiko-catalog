"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Brand } from "@/lib/brands";
import type { Capability, Product, Spec } from "@/lib/products";
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from "../icons";

type Form = {
  code: string;
  name: string;
  section: string;
  series: "B" | "S" | "P" | null;
  ip: string;
  description: string;
  dmxModes: string[];
  capabilities: Capability[];
  specs: Spec[];
  published: boolean;
  needsReview: boolean;
};

const CAPABILITY_PRESETS = ["Zoom", "Frost", "Prism", "CMY", "CTO", "Battery", "Wireless DMX", "RDM", "Art-Net", "sACN", "Pixel control", "Silent (fanless)"];
const SPEC_PRESETS = ["Source", "Voltage", "Power", "Control", "Beam Angle", "Zoom", "Dimmer", "Strobe", "Pan", "Tilt", "Color Wheels", "Gobos", "Colour Temp", "CRI", "LED Life", "Cooling", "Connectors", "Housing", "Operating Temp", "Size", "Weight", "Carton"];

function toForm(p: Product | null): Form {
  return {
    code: p?.code ?? "",
    name: p?.name ?? "",
    section: p?.section ?? "",
    series: p?.series ?? "S",
    ip: p?.ip ?? "IP20",
    description: p?.description ?? "",
    dmxModes: p?.dmxModes ?? [],
    capabilities: p?.capabilities ?? [],
    specs: p?.specs ?? [],
    published: p?.published ?? true,
    needsReview: p?.needsReview ?? false,
  };
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Card({ title, hint, children, action }: { title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="bar flex items-center justify-between gap-4">
        <span>{title}</span>
        {action}
      </div>
      <div className="p-5">
        {hint && <p className="mb-4 text-sm text-grey">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border-2 transition-colors ${checked ? "border-navy bg-navy text-white" : "border-line bg-white text-transparent hover:border-navy"}`}
    >
      <CheckIcon width={14} height={14} strokeWidth={3} />
    </button>
  );
}

export function ProductEditor({
  initial,
  sections,
  ipRatings,
  brands,
}: {
  initial: Product | null;
  sections: string[];
  ipRatings: string[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initial);
  const [form, setForm] = useState<Form>(() => ({ ...toForm(initial), section: initial?.section ?? sections[0] ?? "" }));
  const [saved, setSaved] = useState<string>(() => JSON.stringify(toForm(initial)));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [dmxInput, setDmxInput] = useState("");
  const [capInput, setCapInput] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== saved, [form, saved]);
  const isNew = !product;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (message?.kind !== "ok") return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function call(label: string, input: RequestInfo, init?: RequestInit) {
    setBusy(label);
    setMessage(null);
    try {
      const res = await fetch(input, init);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      return json;
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong" });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const payload = {
      ...form,
      dmxModes: form.dmxModes.filter(Boolean),
      specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      capabilities: form.capabilities.filter((c) => c.label.trim()),
    };
    if (isNew) {
      const json = await call("save", "/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (json?.id) {
        setSaved(JSON.stringify(form));
        router.replace(`/admin/products/${json.id}?created=1`);
        router.refresh();
      }
      return;
    }
    const json = await call("save", `/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (json?.product) {
      setProduct(json.product);
      const next = toForm(json.product);
      setForm(next);
      setSaved(JSON.stringify(next));
      setMessage({ kind: "ok", text: "Saved — the website is updated." });
      router.refresh();
    }
  }

  async function remove() {
    if (!product) return;
    if (!confirm(`Delete ${product.code}? This removes its photos and library files and cannot be undone.`)) return;
    const json = await call("delete", `/api/admin/products/${product.id}`, { method: "DELETE" });
    if (json) {
      setSaved(JSON.stringify(form));
      router.push("/admin");
      router.refresh();
    }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!product || !files?.length) return;
    const body = new FormData();
    for (const f of Array.from(files)) body.append("files", f);
    const json = await call("photos", `/api/admin/products/${product.id}/images`, { method: "POST", body });
    if (json?.product) {
      setProduct(json.product);
      setMessage({ kind: "ok", text: "Photo uploaded." });
    }
    if (photoInput.current) photoInput.current.value = "";
  }

  async function reorderPhotos(order: number[]) {
    if (!product) return;
    const json = await call("photos", `/api/admin/products/${product.id}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (json?.product) setProduct(json.product);
  }

  async function deletePhoto(imageId: number) {
    if (!product || !confirm("Remove this photo?")) return;
    const json = await call("photos", `/api/admin/products/${product.id}/images?imageId=${imageId}`, { method: "DELETE" });
    if (json?.product) setProduct(json.product);
  }

  async function uploadLibrary(consoleId: string, file: File | undefined) {
    if (!product || !file) return;
    const body = new FormData();
    body.append("console", consoleId);
    body.append("file", file);
    const json = await call(`lib-${consoleId}`, `/api/admin/products/${product.id}/libraries`, { method: "POST", body });
    if (json?.product) {
      setProduct(json.product);
      setMessage({ kind: "ok", text: "Library file uploaded — the download button is now live." });
    }
  }

  async function deleteLibrary(consoleId: string, name: string) {
    if (!product || !confirm(`Remove the ${name} file? The download button will disappear from the website.`)) return;
    const json = await call(`lib-${consoleId}`, `/api/admin/products/${product.id}/libraries?console=${consoleId}`, { method: "DELETE" });
    if (json?.product) setProduct(json.product);
  }

  function addDmx() {
    const parts = dmxInput
      .split(/[\/,]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .map((s) => (/^\d+$/.test(s) ? `${s}CH` : s));
    if (parts.length) set("dmxModes", [...form.dmxModes, ...parts.filter((p) => !form.dmxModes.includes(p))]);
    setDmxInput("");
  }

  function addCapability(label: string) {
    const l = label.trim();
    if (!l || form.capabilities.some((c) => c.label.toLowerCase() === l.toLowerCase())) return;
    set("capabilities", [...form.capabilities, { label: l, enabled: true }]);
    setCapInput("");
  }

  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-grey hover:text-navy">
            <ArrowLeftIcon width={16} height={16} /> All products
          </Link>
          <h1 className="mt-2 truncate text-4xl tracking-tight text-ink">
            {isNew ? "New product" : product.code}
          </h1>
          {!isNew && <p className="text-lg font-bold text-orange">{product.name}</p>}
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary cursor-pointer"
              disabled={busy === "duplicate"}
              onClick={async () => {
                const json = await call("duplicate", `/api/admin/products/${product.id}/duplicate`, { method: "POST" });
                if (json?.id) router.push(`/admin/products/${json.id}`);
              }}
            >
              Duplicate
            </button>
            <a href={`/p/${encodeURIComponent(product.code)}`} target="_blank" rel="noreferrer" className="btn-secondary">
              View on site ↗
            </a>
          </div>
        )}
      </div>

      {form.needsReview && (
        <div className="mt-5 flex items-start gap-3 border border-orange bg-zebra p-4 text-sm text-navy">
          <AlertIcon className="mt-0.5 shrink-0" />
          <div>
            <strong>Please check the specs.</strong> Some values of this product were cut off in the original PDF and were shortened
            automatically. Correct them below, then switch off &ldquo;Needs review&rdquo; and save.
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="code">Product code</label>
                <input id="code" className="field font-mono" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
                {!isNew && form.code !== product.code && (
                  <p className="mt-1 text-xs text-navy">Changing the code changes the page address — printed QR codes use the old code.</p>
                )}
              </div>
              <div>
                <label className="field-label" htmlFor="name">Title (type)</label>
                <input id="name" className="field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 230W BEAM" />
              </div>
              <div>
                <label className="field-label" htmlFor="section">Category</label>
                <select id="section" className="field" value={form.section} onChange={(e) => set("section", e.target.value)}>
                  {form.section && !sections.includes(form.section) && <option>{form.section}</option>}
                  {sections.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="series">Series</label>
                  <select id="series" className="field" value={form.series ?? ""} onChange={(e) => set("series", (e.target.value || null) as Form["series"])}>
                    <option value="B">Budget</option>
                    <option value="S">Standard</option>
                    <option value="P">Premium</option>
                    <option value="">None</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="ip">IP rating</label>
                  <select id="ip" className="field" value={form.ip} onChange={(e) => set("ip", e.target.value)}>
                    {!ipRatings.includes(form.ip) && <option>{form.ip}</option>}
                    {ipRatings.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="desc">Description (optional)</label>
                <textarea id="desc" rows={3} className="field resize-y" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short sales text shown under the title on the product page." />
              </div>
              <div className="flex items-center justify-between gap-4 border border-line bg-zebra p-3 sm:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-ink">Visible on website</div>
                  <div className="text-xs text-grey">Hidden products return &ldquo;not found&rdquo; and are left out of the catalog.</div>
                </div>
                <Toggle label="Visible on website" checked={form.published} onChange={(v) => set("published", v)} />
              </div>
              <div className="flex items-center justify-between gap-4 border border-line bg-zebra p-3 sm:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-ink">Needs review</div>
                  <div className="text-xs text-grey">Only a reminder for you — not shown to visitors.</div>
                </div>
                <Toggle label="Needs review" checked={form.needsReview} onChange={(v) => set("needsReview", v)} />
              </div>
            </div>
          </Card>

          <Card title="Specifications" hint="Shown as a table on the product page. Drag order with the arrows.">
            <datalist id="spec-labels">
              {SPEC_PRESETS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="field w-[38%] shrink-0"
                    list="spec-labels"
                    value={s.label}
                    placeholder="Label"
                    onChange={(e) => set("specs", form.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  />
                  <input
                    className="field min-w-0 flex-1"
                    value={s.value}
                    placeholder="Value"
                    onChange={(e) => set("specs", form.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                  />
                  <div className="flex shrink-0 flex-col">
                    <button type="button" disabled={i === 0} onClick={() => set("specs", move(form.specs, i, i - 1))} className="cursor-pointer p-0.5 text-grey hover:text-navy disabled:opacity-20" aria-label="Move up">
                      <ChevronUpIcon width={16} height={16} />
                    </button>
                    <button type="button" disabled={i === form.specs.length - 1} onClick={() => set("specs", move(form.specs, i, i + 1))} className="cursor-pointer p-0.5 text-grey hover:text-navy disabled:opacity-20" aria-label="Move down">
                      <ChevronDownIcon width={16} height={16} />
                    </button>
                  </div>
                  <button type="button" onClick={() => set("specs", form.specs.filter((_, j) => j !== i))} className="shrink-0 cursor-pointer p-2 text-grey hover:bg-zebra hover:text-danger" aria-label="Remove spec">
                    <TrashIcon width={17} height={17} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => set("specs", [...form.specs, { label: "", value: "" }])} className="btn-secondary mt-3 w-full cursor-pointer border-dashed py-2.5">
              <PlusIcon width={16} height={16} /> Add specification
            </button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Photos" hint="The first photo is the main one (website + PDF).">
            {isNew ? (
              <p className="border border-dashed border-line p-6 text-center text-sm text-grey">Save the product first, then add photos.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {product.images.map((img, i) => (
                    <div key={img.id} className="group relative">
                      <div className={`bg-white relative aspect-square overflow-hidden border-2 ${i === 0 ? "border-orange" : "border-transparent"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-contain p-1.5" />
                        {i === 0 && (
                          <span className="absolute left-1 top-1 bg-orange px-1.5 py-0.5 text-[9px] font-bold uppercase text-navy">Main</span>
                        )}
                      </div>
                      <div className="mt-1 flex justify-center gap-1">
                        {i > 0 && (
                          <button type="button" title="Make main photo" onClick={() => reorderPhotos(move(product.images.map((x) => x.id), i, 0))} className="cursor-pointer p-1 text-grey hover:bg-zebra hover:text-orange-dark">
                            <StarIcon width={15} height={15} />
                          </button>
                        )}
                        <button type="button" title="Remove photo" onClick={() => deletePhoto(img.id)} className="cursor-pointer p-1 text-grey hover:bg-zebra hover:text-danger">
                          <TrashIcon width={15} height={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => photoInput.current?.click()}
                    disabled={busy === "photos"}
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-line text-xs text-grey transition hover:border-orange hover:text-orange-dark"
                  >
                    <UploadIcon />
                    {busy === "photos" ? "Uploading…" : "Add photos"}
                  </button>
                </div>
                <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
                <p className="mt-3 text-xs text-grey">JPG, PNG or WebP up to 15 MB. Photos are resized and optimised automatically. A white background looks best.</p>
              </>
            )}
          </Card>

          <Card
            title="Console libraries"
            hint="Upload the fixture library per brand. A download button only shows on the website when a file is attached. Manage brands under Brands."
          >
            {isNew ? (
              <p className="border border-dashed border-line p-6 text-center text-sm text-grey">Save the product first, then upload library files.</p>
            ) : brands.length === 0 ? (
              <p className="text-sm text-grey">
                No brands yet — <Link href="/admin/brands" className="underline">add one under Brands</Link>.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {brands.map((c) => {
                  const file = product.libraries.find((l) => l.console === c.slug);
                  const inputId = `lib-${c.slug}`;
                  return (
                    <li key={c.slug} className={`flex items-center gap-3 border p-3 ${file ? "border-navy bg-white" : "border-line bg-zebra"}`}>
                      <span className="flex h-11 w-14 shrink-0 items-center justify-center p-1" style={{ backgroundColor: c.color }}>
                        {c.logoUrl ? (
                          <span className="flex h-full w-full items-center justify-center bg-white p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                          </span>
                        ) : (
                          <span className="font-label text-sm font-bold" style={{ color: c.textColor }}>{c.short}</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">
                          {c.name}
                          {!c.enabled && <span className="ml-2 text-xs font-normal text-grey">(brand switched off — not shown)</span>}
                        </div>
                        {file ? (
                          <a href={file.url} className="flex items-center gap-1 truncate text-xs text-ok hover:underline">
                            <FileIcon width={12} height={12} className="shrink-0" /> {file.originalName} · {formatSize(file.size)}
                          </a>
                        ) : (
                          <div className="text-xs text-grey">No file — button hidden{c.hint ? ` · ${c.hint}` : ""}</div>
                        )}
                      </div>
                      <label htmlFor={inputId} className={`btn-secondary shrink-0 cursor-pointer px-3 py-2 text-xs ${busy === inputId ? "pointer-events-none opacity-50" : ""}`}>
                        <UploadIcon width={14} height={14} /> {busy === inputId ? "…" : file ? "Replace" : "Upload"}
                      </label>
                      <input
                        id={inputId}
                        type="file"
                        accept={c.accept || undefined}
                        className="hidden"
                        onChange={(e) => {
                          uploadLibrary(c.slug, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                      {file && (
                        <button type="button" onClick={() => deleteLibrary(c.slug, c.name)} className="shrink-0 cursor-pointer p-2 text-grey hover:bg-zebra hover:text-danger" aria-label={`Remove ${c.name} file`}>
                          <TrashIcon width={16} height={16} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="DMX modes">
            <div className="flex flex-wrap gap-2">
              {form.dmxModes.map((m, i) => (
                <span key={`${m}-${i}`} className="tag border-line py-1.5 pr-1.5 text-ink">
                  {m}
                  <button type="button" onClick={() => set("dmxModes", form.dmxModes.filter((_, j) => j !== i))} className="cursor-pointer p-0.5 text-grey hover:bg-zebra hover:text-navy" aria-label={`Remove ${m}`}>
                    <XIcon width={12} height={12} />
                  </button>
                </span>
              ))}
              {form.dmxModes.length === 0 && <span className="text-sm text-grey">None — shown as &ldquo;on request&rdquo;.</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="field"
                value={dmxInput}
                onChange={(e) => setDmxInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDmx();
                  }
                }}
                placeholder="e.g. 16CH / 20CH"
              />
              <button type="button" onClick={addDmx} className="btn-secondary shrink-0 cursor-pointer px-4">Add</button>
            </div>
          </Card>

          <Card title="Features" hint="Ticked = shown as Yes, unticked = No. Remove a feature to hide it completely.">
            <ul className="space-y-1.5">
              {form.capabilities.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-3 border border-line bg-zebra px-3 py-2">
                  <span className={`flex-1 text-sm font-medium ${c.enabled ? "text-ink" : "text-grey"}`}>{c.label}</span>
                  <Toggle label={c.label} checked={c.enabled} onChange={(v) => set("capabilities", form.capabilities.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} />
                  <button type="button" onClick={() => set("capabilities", form.capabilities.filter((_, j) => j !== i))} className="cursor-pointer p-1.5 text-grey hover:bg-zebra hover:text-danger" aria-label={`Remove ${c.label}`}>
                    <TrashIcon width={15} height={15} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CAPABILITY_PRESETS.filter((p) => !form.capabilities.some((c) => c.label.toLowerCase() === p.toLowerCase())).map((p) => (
                <button key={p} type="button" onClick={() => addCapability(p)} className="tag cursor-pointer hover:border-orange hover:text-orange-dark">
                  <PlusIcon width={12} height={12} /> {p}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="field"
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCapability(capInput);
                  }
                }}
                placeholder="Custom feature…"
              />
              <button type="button" onClick={() => addCapability(capInput)} className="btn-secondary shrink-0 cursor-pointer px-4">Add</button>
            </div>
          </Card>

          {!isNew && (
            <section className="border border-danger p-5">
              <h2 className="caps text-[11px] text-danger">Delete product</h2>
              <p className="mt-1 text-sm text-grey">Removes the product, its photos, library files and short links. Tip: switch off &ldquo;Visible on website&rdquo; to hide it instead.</p>
              <button type="button" onClick={remove} disabled={busy === "delete"} className="btn mt-3 cursor-pointer border border-danger text-danger hover:bg-zebra">
                <TrashIcon width={16} height={16} /> Delete {product.code}
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1 text-sm">
            {message ? (
              <span className={message.kind === "ok" ? "text-ok" : "text-danger"}>{message.text}</span>
            ) : dirty ? (
              <span className="text-navy">You have unsaved changes</span>
            ) : (
              <span className="text-grey">{isNew ? "Fill in the basics and save" : "All changes saved"}</span>
            )}
          </div>
          {dirty && !isNew && (
            <button type="button" onClick={() => setForm(JSON.parse(saved))} className="btn-secondary cursor-pointer px-4 py-2.5">
              Discard
            </button>
          )}
          <button type="button" onClick={save} disabled={busy === "save" || (!dirty && !isNew)} className="btn-primary cursor-pointer px-6 py-2.5">
            {busy === "save" ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
