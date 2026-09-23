"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { CheckIcon, CopyIcon, MonitorIcon, ShareIcon } from "./icons";

export function ShareButton({ code, className, compact }: { code: string; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<{ url: string; display: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => setCanNativeShare("share" in navigator), []);

  async function openShare() {
    setOpen(true);
    if (link) return;
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error();
      setLink(await res.json());
    } catch {
      setError("Could not create a short link. Please try again.");
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
    } catch {
      const input = document.getElementById("share-url") as HTMLInputElement | null;
      input?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }


  return (
    <>
      <button type="button" className={`${className} cursor-pointer`} onClick={openShare} aria-label="Share this product">
        <ShareIcon /> {!compact && "Share"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Open on your computer">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-brand/15 text-amber-brand">
            <MonitorIcon width={28} height={28} />
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm text-navy-200">
            Type this short link into the browser on your PC or laptop to open this product page there, or share it with a colleague.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-brand/30 bg-navy-950 px-4 py-5">
            {link ? (
              <div className="font-display font-semibold text-white">
                <div className="break-all text-lg text-navy-200 sm:text-xl">{link.display.split("/s/")[0]}</div>
                <div className="mt-1 text-4xl tracking-wider">
                  /s/<span className="text-amber-brand">{link.display.split("/s/")[1]}</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-sm text-red-300">{error}</div>
            ) : (
              <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-white/10" />
            )}
          </div>
          {link && <input id="share-url" readOnly value={link.url} className="sr-only" />}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button onClick={copy} disabled={!link} className="btn-primary cursor-pointer">
              {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied!" : "Copy link"}
            </button>
            {canNativeShare ? (
              <button
                disabled={!link}
                className="btn-ghost cursor-pointer"
                onClick={() => link && navigator.share({ title: `LUXIKO ${code}`, url: link.url }).catch(() => {})}
              >
                <ShareIcon /> Share…
              </button>
            ) : (
              <a
                className="btn-ghost"
                href={link ? `mailto:?subject=${encodeURIComponent(`LUXIKO ${code}`)}&body=${encodeURIComponent(link.url)}` : undefined}
              >
                <ShareIcon /> E-mail link
              </a>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
