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
};

const STATUS: Record<string, string> = {
  new: "bg-amber-brand text-navy-950",
  answered: "bg-sky-500/20 text-sky-200",
  won: "bg-emerald-500/20 text-emerald-200",
  lost: "bg-white/10 text-navy-300",
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
    return <div className="card mt-6 p-10 text-center text-navy-300">No quote requests yet. They will appear here as soon as someone uses the quote button.</div>;
  }

  return (
    <ul className="mt-6 space-y-2">
      {rows.map((q) => (
        <li key={q.id} className="card overflow-hidden">
          <button onClick={() => setOpen(open === q.id ? null : q.id)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02]">
            <span className={`w-20 shrink-0 rounded-md px-2 py-1 text-center text-[10px] font-bold uppercase ${STATUS[q.status] ?? STATUS.lost}`}>{q.status}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {q.quantity}× {q.productCode} <span className="font-normal text-navy-300">— {q.company || q.name}</span>
              </span>
              <span className="block truncate text-xs text-navy-300">{q.email} · {new Date(q.createdAt.replace(" ", "T") + "Z").toLocaleString()}</span>
            </span>
          </button>
          {open === q.id && (
            <div className="border-t border-white/5 px-4 py-4">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[
                  ["Name", q.name],
                  ["Company", q.company],
                  ["E-mail", q.email],
                  ["Phone", q.phone],
                  ["Country", q.country],
                  ["For", q.purpose],
                  ["Needed by", q.neededBy],
                  ["E-mail sent", q.emailSent ? "Yes" : "No"],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-24 shrink-0 text-navy-300">{k}</dt>
                      <dd className="min-w-0 break-words text-white">{v}</dd>
                    </div>
                  ))}
              </dl>
              {q.message && <p className="mt-3 whitespace-pre-line rounded-xl bg-white/[0.03] p-3 text-sm text-navy-100">{q.message}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a className="btn-primary px-4 py-2" href={`mailto:${q.email}?subject=${encodeURIComponent(`Your LUXIKO quote for ${q.productCode}`)}`}>Reply by e-mail</a>
                {q.phone && <a className="btn-ghost px-4 py-2" href={`tel:${q.phone.replace(/\s+/g, "")}`}>Call</a>}
                {q.productId && <Link className="btn-ghost px-4 py-2" href={`/admin/products/${q.productId}`}>Open product</Link>}
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
