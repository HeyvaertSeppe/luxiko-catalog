"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from "../icons";

type Option = { label: string; enabled: boolean };

export function QuoteOptionsForm({ initial }: { initial: Option[] }) {
  const router = useRouter();
  const [list, setList] = useState<Option[]>(initial);
  const [newLabel, setNewLabel] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(list) !== JSON.stringify(initial);

  const update = (i: number, patch: Partial<Option>) => setList(list.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const move = (i: number, d: number) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setList(next);
  };

  async function save() {
    setMessage(null);
    const res = await fetch("/api/admin/quote-options", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options: list }),
    }).catch(() => null);
    const json = (res ? await res.json().catch(() => ({})) : {}) as { error?: string };
    if (!res?.ok) return setMessage({ ok: false, text: json.error ?? "Could not save" });
    setMessage({ ok: true, text: "Saved — the quote form is updated." });
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <ul className="divide-y divide-line border border-line">
        {list.map((o, i) => (
          <li key={i} className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              role="switch"
              aria-checked={o.enabled}
              aria-label={`Show ${o.label}`}
              onClick={() => update(i, { enabled: !o.enabled })}
              className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border-2 ${o.enabled ? "border-navy bg-navy text-white" : "border-line text-transparent hover:border-navy"}`}
            >
              <CheckIcon width={14} height={14} strokeWidth={3} />
            </button>
            <input
              className={`field py-1.5 ${o.enabled ? "" : "text-grey line-through"}`}
              value={o.label}
              maxLength={60}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <div className="flex shrink-0 flex-col">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="cursor-pointer text-grey hover:text-navy disabled:opacity-20" aria-label="Move up">
                <ChevronUpIcon width={16} height={16} />
              </button>
              <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="cursor-pointer text-grey hover:text-navy disabled:opacity-20" aria-label="Move down">
                <ChevronDownIcon width={16} height={16} />
              </button>
            </div>
            <button type="button" onClick={() => setList(list.filter((_, j) => j !== i))} className="cursor-pointer p-1.5 text-grey hover:text-danger" aria-label={`Remove ${o.label}`}>
              <TrashIcon width={16} height={16} />
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="px-3 py-3 text-sm text-grey">No options — the field is hidden.</li>}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          className="field"
          placeholder="New option, e.g. Dry hire"
          value={newLabel}
          maxLength={60}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newLabel.trim()) {
              e.preventDefault();
              setList([...list, { label: newLabel.trim(), enabled: true }]);
              setNewLabel("");
            }
          }}
        />
        <button
          type="button"
          className="btn-secondary shrink-0 cursor-pointer px-4"
          onClick={() => {
            if (!newLabel.trim()) return;
            setList([...list, { label: newLabel.trim(), enabled: true }]);
            setNewLabel("");
          }}
        >
          <PlusIcon width={16} height={16} /> Add
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={!dirty} onClick={save} className="btn-primary cursor-pointer">
          Save quote options
        </button>
        {message && <span className={`text-sm ${message.ok ? "text-ok" : "text-danger"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
