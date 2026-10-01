"use client";

import { useId, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import { Modal } from "./Modal";
import { QuoteIcon } from "./icons";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string } | { kind: "done"; emailed: boolean };

export function QuoteButton({
  code,
  name,
  image,
  purposes,
  lang,
  t,
  label,
  closeLabel,
  className,
}: {
  code: string;
  name: string;
  image?: string;
  purposes: { value: string; label: string }[];
  lang: Locale;
  t: Dict["quote"];
  label: string;
  closeLabel: string;
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
        body: JSON.stringify({ ...data, code, lang }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
      if (!res.ok) throw new Error(json.error || t.errorGeneric);
      setStatus({ kind: "done", emailed: Boolean(json.emailed) });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error && err.message !== "Failed to fetch" ? err.message : t.errorGeneric });
    }
  }

  return (
    <>
      <button type="button" className={`${className} cursor-pointer`} onClick={() => setOpen(true)}>
        <QuoteIcon width={18} height={18} /> {label}
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          if (status.kind === "done") setStatus({ kind: "idle" });
        }}
        title={t.title}
        closeLabel={closeLabel}
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
            <p className="caps text-sm text-navy">{t.sentKicker}</p>
            <h3 className="mt-2 text-3xl tracking-tight text-ink">{t.thanks}</h3>
            <p className="mt-3 text-navy">
              {t.sentBody}
              {status.emailed && ` ${t.confirmationSent}`}
            </p>
            <button className="btn-secondary mt-6 cursor-pointer" onClick={() => setOpen(false)}>
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-name`}>{t.name} *</label>
              <input id={`${uid}-q-name`} name="name" required minLength={2} autoComplete="name" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-company`}>{t.company}</label>
              <input id={`${uid}-q-company`} name="company" autoComplete="organization" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-email`}>{t.email} *</label>
              <input id={`${uid}-q-email`} name="email" type="email" required autoComplete="email" className="field" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label" htmlFor={`${uid}-q-phone`}>{t.phone}</label>
              <input id={`${uid}-q-phone`} name="phone" type="tel" autoComplete="tel" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-q-qty`}>{t.quantity} *</label>
              <input id={`${uid}-q-qty`} name="quantity" type="number" min={1} defaultValue={1} required inputMode="numeric" className="field" />
            </div>
            {purposes.length > 0 && (
              <div>
                <label className="field-label" htmlFor={`${uid}-q-purpose`}>{t.for}</label>
                <select id={`${uid}-q-purpose`} name="purpose" className="field" defaultValue={purposes[0].value}>
                  {purposes.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="field-label" htmlFor={`${uid}-q-country`}>{t.country}</label>
              <input id={`${uid}-q-country`} name="country" autoComplete="country-name" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor={`${uid}-q-date`}>{t.neededBy}</label>
              <input id={`${uid}-q-date`} name="neededBy" type="date" className="field" />
            </div>
            <div className="col-span-2">
              <label className="field-label" htmlFor={`${uid}-q-msg`}>{t.message}</label>
              <textarea id={`${uid}-q-msg`} name="message" rows={3} maxLength={3000} className="field resize-y" placeholder={t.messagePlaceholder} />
            </div>
            {/* Honeypot for spam bots — hidden from people */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {status.kind === "error" && (
              <p className="col-span-2 border-l-4 border-danger bg-zebra px-3 py-2 text-sm text-danger">{status.message}</p>
            )}
            <button type="submit" disabled={status.kind === "sending"} className="btn-primary col-span-2 mt-1 cursor-pointer py-4">
              {status.kind === "sending" ? t.sending : t.send}
            </button>
            <p className="col-span-2 text-xs text-grey">{t.privacy}</p>
          </form>
        )}
      </Modal>
    </>
  );
}
