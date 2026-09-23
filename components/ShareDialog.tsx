"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { CheckIcon, CopyIcon, ShareIcon } from "./icons";

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
        <ShareIcon width={18} height={18} /> {!compact && "Share"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Open on your computer">
        <p className="text-navy">
          Type this short link into the browser on your PC or laptop to open this product page there, or send it to a colleague.
        </p>

        <div className="mt-5 border-l-4 border-orange bg-zebra px-4 py-5">
          {link ? (
            <>
              <div className="break-all text-lg text-grey">{link.display.split("/s/")[0]}</div>
              <div className="mt-1 text-4xl tracking-wide text-ink">
                /s/<span className="font-bold text-orange">{link.display.split("/s/")[1]}</span>
              </div>
            </>
          ) : error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : (
            <div className="h-16 animate-pulse bg-line" />
          )}
        </div>
        {link && <input id="share-url" readOnly value={link.url} className="sr-only" />}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button onClick={copy} disabled={!link} className="btn-primary cursor-pointer">
            {copied ? <CheckIcon width={18} height={18} /> : <CopyIcon width={18} height={18} />} {copied ? "Copied" : "Copy link"}
          </button>
          {canNativeShare ? (
            <button
              disabled={!link}
              className="btn-secondary cursor-pointer"
              onClick={() => link && navigator.share({ title: `LUXIKO ${code}`, url: link.url }).catch(() => {})}
            >
              <ShareIcon width={18} height={18} /> Share
            </button>
          ) : (
            <a
              className="btn-secondary"
              href={link ? `mailto:?subject=${encodeURIComponent(`LUXIKO ${code}`)}&body=${encodeURIComponent(link.url)}` : undefined}
            >
              <ShareIcon width={18} height={18} /> E-mail link
            </a>
          )}
        </div>
      </Modal>
    </>
  );
}
