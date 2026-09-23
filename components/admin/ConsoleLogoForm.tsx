"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadIcon } from "../icons";

export function ConsoleLogoForm({ id, name, url, custom }: { id: string; name: string; url: string; custom: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/admin/consoles/${id}`, { method: "POST", body });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Upload failed");
    setBusy(false);
    router.refresh();
  }

  async function reset() {
    setBusy(true);
    await fetch(`/api/admin/consoles/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`${name} logo`} className={custom ? "h-10 w-10 object-contain" : "h-14 w-14"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="text-xs text-navy-300">{custom ? "Custom logo" : "Built-in badge"}</div>
        {error && <div className="text-xs text-red-300">{error}</div>}
      </div>
      <label className={`btn-ghost cursor-pointer px-3 py-2 text-xs ${busy ? "pointer-events-none opacity-50" : ""}`}>
        <UploadIcon width={14} height={14} /> Upload
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      {custom && (
        <button onClick={reset} disabled={busy} className="cursor-pointer text-xs text-navy-300 hover:text-white">
          Reset
        </button>
      )}
    </div>
  );
}
