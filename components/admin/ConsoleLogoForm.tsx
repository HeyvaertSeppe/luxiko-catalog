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
    <div className="flex items-center gap-3 border border-line bg-zebra p-3">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`${name} logo`} className={custom ? "h-10 w-10 object-contain" : "h-14 w-14"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">{name}</div>
        <div className="text-xs text-grey">{custom ? "Custom logo" : "Built-in badge"}</div>
        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
      <label className={`btn-secondary cursor-pointer px-3 py-2 text-xs ${busy ? "pointer-events-none opacity-50" : ""}`}>
        <UploadIcon width={14} height={14} /> Upload
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      {custom && (
        <button onClick={reset} disabled={busy} className="cursor-pointer text-xs text-grey hover:text-navy">
          Reset
        </button>
      )}
    </div>
  );
}
