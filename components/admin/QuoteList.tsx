"use client";

import Link from "next/link";
import { useState } from "react";

export type QuoteRow = {
  id: number;
  productCode: string;
  productId: number | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  quantity: number;
  purpose: string;
  neededBy: string;
  message: string;
  status: string;
  emailSent: number;
  createdAt: string;
  lang: string;
};

const STATUS: Record<string, string> = {
  new: "bg-orange text-navy",
  answered: "bg-navy text-white",
  won: "bg-ok text-white",
  lost: "bg-zebra text-grey",
};

export function QuoteList({ rows: initial }: { rows: QuoteRow[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<number | null>(initial[0]?.status === "new" ? initial[0].id : null);

  async function setStatus(id: number, status: string) {
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setRows((r) => r.map((q) => (q.id === id ? { ...q, status } : q)));
  }

  if (!rows.length) {
    return <div className="panel mt-6 p-10 text-center text-grey">No quote requests yet. They will appear here as soon as someone uses the quote button or the contact form on the main website.</div>;
  }

  return (
    <ul className="mt-6 space-y-2">
      {rows.map((q) => (
        <li key={q.id} className="panel overflow-hidden">
          <button onClick={() => setOpen(open === q.id ? null : q.id)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-zebra">
            <span className={`w-20 shrink-0 px-2 py-1 text-center text-[10px] font-bold uppercase ${STATUS[q.status] ?? STATUS.lost}`}>{q.status}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">
                {q.productCode ? `${q.quantity}× ${q.productCode}` : "Website message"} <span className="font-normal text-grey">— {q.company || q.name}</span>
              </span>
              <span className="block truncate text-xs text-grey">{q.email} · {new Date(q.createdAt.replace(" ", "T") + "Z").toLocaleString()}</span>
            </span>
          </button>
          {open === q.id && (
            <div className="border-t border-line px-4 py-4">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[
                  ["Name", q.name],
                  ["Company", q.company],
                  ["E-mail", q.email],
                  ["Phone", q.phone],
                  ["Country", q.country],
                  ["For", q.purpose],
                  ["Needed by", q.neededBy],
                  ["Language", ({ en: "English", nl: "Dutch", fr: "French" } as Record<string, string>)[q.lang] ?? q.lang],
                  ["E-mail sent", q.emailSent ? "Yes" : "No"],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-24 shrink-0 text-grey">{k}</dt>
                      <dd className="min-w-0 break-words text-ink">{v}</dd>
                    </div>
                  ))}
              </dl>
              {q.message && <p className="mt-3 whitespace-pre-line bg-zebra p-3 text-sm text-ink">{q.message}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a className="btn-primary px-4 py-2" href={`mailto:${q.email}?subject=${encodeURIComponent(q.productCode ? `Your LUXIKO quote for ${q.productCode}` : "Your message to LUXIKO")}`}>Reply by e-mail</a>
                {q.phone && <a className="btn-secondary px-4 py-2" href={`tel:${q.phone.replace(/\s+/g, "")}`}>Call</a>}
                {q.productId && <Link className="btn-secondary px-4 py-2" href={`/admin/products/${q.productId}`}>Open product</Link>}
                <select value={q.status} onChange={(e) => setStatus(q.id, e.target.value)} className="field ml-auto w-auto py-2">
                  <option value="new">New</option>
                  <option value="answered">Answered</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
