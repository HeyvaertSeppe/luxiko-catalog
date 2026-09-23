"use client";

import { useId, useState } from "react";
import { Modal } from "./Modal";
import { QuoteIcon } from "./icons";

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
        <QuoteIcon width={18} height={18} /> Request a quote
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          if (status.kind === "done") setStatus({ kind: "idle" });
        }}
        title="Request a quote"
      >
        <div className="mb-5 flex items-center gap-4 border-b border-line pb-4">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-14 w-20 shrink-0 object-contain" />
          )}
          <div className="min-w-0">
            <div className="truncate text-xl text-ink">{code}</div>
            <div className="truncate font-bold text-orange">{name}</div>
          </div>
        </div>

        {status.kind === "done" ? (
          <div className="py-6">
            <p className="caps text-sm text-navy">Request sent</p>
            <h3 className="mt-2 text-3xl tracking-tight text-ink">Thank you.</h3>
            <p className="mt-3 text-navy">
              We will get back to you with a price as soon as possible.
              {status.emailed && " A confirmation was sent to your inbox."}
            </p>
            <button className="btn-secondary mt-6 cursor-pointer" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-name`}>Name *</label>
              <input id={`${uid}-q-name`} name="name" required minLength={2} autoComplete="name" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-company`}>Company</label>
              <input id={`${uid}-q-company`} name="company" autoComplete="organization" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-email`}>E-mail *</label>
              <input id={`${uid}-q-email`} name="email" type="email" required autoComplete="email" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-phone`}>Phone</label>
              <input id={`${uid}-q-phone`} name="phone" type="tel" autoComplete="tel" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-q-qty`}>Quantity *</label>
              <input id={`${uid}-q-qty`} name="quantity" type="number" min={1} defaultValue={1} required inputMode="numeric" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-q-purpose`}>For</label>
              <select id={`${uid}-q-purpose`} name="purpose" className="field" defaultValue="Purchase">
                <option>Purchase</option>
                <option>Rental</option>
                <option>Installation project</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-q-country`}>Country</label>
              <input id={`${uid}-q-country`} name="country" autoComplete="country-name" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-q-date`}>Needed by</label>
              <input id={`${uid}-q-date`} name="neededBy" type="date" className="field" />
            </div>
            <div className="col-span-2">
              <label className="field-label" htmlFor={`${uid}-q-msg`}>Message</label>
              <textarea id={`${uid}-q-msg`} name="message" rows={3} maxLength={3000} className="field resize-y" placeholder="Delivery address, accessories, flight cases…" />
            </div>
            {/* Honeypot for spam bots — hidden from people */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {status.kind === "error" && (
              <p className="col-span-2 border-l-4 border-danger bg-zebra px-3 py-2 text-sm text-danger">{status.message}</p>
            )}
            <button type="submit" disabled={status.kind === "sending"} className="btn-primary col-span-2 mt-1 cursor-pointer py-4">
              {status.kind === "sending" ? "Sending…" : "Send quote request"}
            </button>
            <p className="col-span-2 text-xs text-grey">We only use your details to answer this request.</p>
          </form>
        )}
      </Modal>
    </>
  );
}
