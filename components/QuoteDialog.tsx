"use client";

import { useId, useState } from "react";
import { Modal } from "./Modal";
import { CheckIcon, QuoteIcon } from "./icons";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string } | { kind: "done"; emailed: boolean };

export function QuoteButton({
  code,
  name,
  image,
  className,
}: {
  code: string;
  name: string;
  image?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const uid = useId();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, code }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
      if (!res.ok) throw new Error(json.error || "Something went wrong, please try again.");
      setStatus({ kind: "done", emailed: Boolean(json.emailed) });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }

  return (
    <>
      <button type="button" className={`${className} cursor-pointer`} onClick={() => setOpen(true)}>
        <QuoteIcon /> Request a quote
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          if (status.kind === "done") setStatus({ kind: "idle" });
        }}
        title="Request a quote"
      >
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/5 bg-navy-950/50 p-3">
          {image && (
            <span className="product-stage relative h-14 w-16 shrink-0 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-contain p-1 mix-blend-multiply" />
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate font-display font-semibold text-white">{code}</div>
            <div className="truncate text-xs font-semibold uppercase text-amber-brand">{name}</div>
          </div>
        </div>

        {status.kind === "done" ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-brand text-navy-950">
              <CheckIcon width={28} height={28} strokeWidth={3} />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold text-white">Request sent!</h3>
            <p className="mt-2 text-sm text-navy-300">
              Thanks — we will get back to you with a price as soon as possible.{status.emailed && " A confirmation was sent to your inbox."}
            </p>
            <button className="btn-ghost mt-6 cursor-pointer" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor={`${uid}-q-name`}>Name *</label>
              <input id={`${uid}-q-name`} name="name" required minLength={2} autoComplete="name" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor={`${uid}-q-company`}>Company</label>
              <input id={`${uid}-q-company`} name="company" autoComplete="organization" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor={`${uid}-q-email`}>E-mail *</label>
              <input id={`${uid}-q-email`} name="email" type="email" required autoComplete="email" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor={`${uid}-q-phone`}>Phone</label>
              <input id={`${uid}-q-phone`} name="phone" type="tel" autoComplete="tel" className="field" />
            </div>
            <div>
              <label className="label" htmlFor={`${uid}-q-qty`}>Quantity *</label>
              <input id={`${uid}-q-qty`} name="quantity" type="number" min={1} defaultValue={1} required inputMode="numeric" className="field" />
            </div>
            <div>
              <label className="label" htmlFor={`${uid}-q-purpose`}>For</label>
              <select id={`${uid}-q-purpose`} name="purpose" className="field" defaultValue="Purchase">
                <option>Purchase</option>
                <option>Rental</option>
                <option>Installation project</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor={`${uid}-q-country`}>Country</label>
              <input id={`${uid}-q-country`} name="country" autoComplete="country-name" className="field" />
            </div>
            <div>
              <label className="label" htmlFor={`${uid}-q-date`}>Needed by</label>
              <input id={`${uid}-q-date`} name="neededBy" type="date" className="field [color-scheme:dark]" />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor={`${uid}-q-msg`}>Message</label>
              <textarea id={`${uid}-q-msg`} name="message" rows={3} maxLength={3000} className="field resize-y" placeholder="Anything we should know? Delivery address, accessories, flight cases…" />
            </div>
            {/* Honeypot for spam bots — hidden from people */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {status.kind === "error" && (
              <p className="col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{status.message}</p>
            )}
            <button type="submit" disabled={status.kind === "sending"} className="btn-primary col-span-2 mt-1 cursor-pointer py-3.5 text-base">
              {status.kind === "sending" ? "Sending…" : "Send quote request"}
            </button>
            <p className="col-span-2 text-center text-xs text-navy-300">
              We only use your details to answer this request.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
