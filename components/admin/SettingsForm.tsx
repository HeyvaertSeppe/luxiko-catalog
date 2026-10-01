"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FieldDef, SettingsGroup } from "@/lib/settings-schema";
import { CheckIcon, CopyIcon } from "../icons";

export type FieldState = FieldDef & {
  value: string;
  defaultValue: string;
  isSet: boolean;
  source: "admin" | "env" | "default" | "none";
};

type Group = Omit<SettingsGroup, "fields"> & { fields: FieldState[] };

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-navy underline decoration-orange decoration-2 underline-offset-2 hover:text-orange-dark">
      {children} ↗
    </a>
  );
}

export function SettingsForm({ groups, redirectUri }: { groups: Group[]; redirectUri: string }) {
  const router = useRouter();
  const initial = useMemo(() => Object.fromEntries(groups.flatMap((g) => g.fields.map((f) => [f.key, f.value]))), [groups]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [clear, setClear] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  // After saving, the server sends fresh values: start from those again.
  useEffect(() => setValues(initial), [initial]);

  const changed = Object.keys(values).filter((k) => values[k] !== initial[k]);
  const dirty = changed.length > 0 || clear.length > 0;

  async function save() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: Object.fromEntries(changed.map((k) => [k, values[k]])), clear }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setMessage({ ok: false, text: (json as { error?: string }).error ?? "Could not save" });
      return;
    }
    setClear([]);
    setMessage({ ok: true, text: "Saved. Changes are live immediately." });
    router.refresh();
  }

  async function testEmail() {
    setMessage(null);
    const res = await fetch("/api/admin/settings/test-email", { method: "POST" }).catch(() => null);
    const json = (res ? await res.json().catch(() => ({})) : {}) as { error?: string; to?: string };
    setMessage(res?.ok ? { ok: true, text: `Test e-mail sent to ${json.to}.` } : { ok: false, text: json.error ?? "Test failed" });
  }

  return (
    <div className="space-y-8 pb-20">
      {groups.map((g) => (
        <section key={g.title} className="panel">
          <div className="bar">{g.title}</div>
          <div className="space-y-5 p-6">
            {g.intro && <p className="max-w-2xl text-sm text-grey">{g.intro}</p>}
            {g.title.startsWith("Google") && (
              <div className="border-l-4 border-orange bg-zebra px-3 py-2 text-sm text-navy">
                In Google Cloud, add this <strong>Authorised redirect URI</strong>:
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="break-all bg-white px-2 py-1 text-ink">{redirectUri}</code>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-navy hover:text-orange-dark"
                    onClick={() => {
                      navigator.clipboard?.writeText(redirectUri);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />} {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
            {g.fields.map((f) => {
              const willClear = clear.includes(f.key);
              return (
                <div key={f.key}>
                  <label className="field-label" htmlFor={f.key}>
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      id={f.key}
                      rows={3}
                      className="field max-w-2xl"
                      value={values[f.key]}
                      placeholder={f.defaultValue || f.placeholder}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      id={f.key}
                      type={f.secret ? "password" : "text"}
                      autoComplete={f.secret ? "new-password" : "off"}
                      spellCheck={false}
                      className="field max-w-2xl font-mono"
                      value={values[f.key]}
                      disabled={willClear}
                      placeholder={
                        f.secret
                          ? f.isSet
                            ? "•••••••••••••  Saved — hidden. Type to replace."
                            : f.placeholder ?? "Not set"
                          : f.defaultValue
                            ? `${f.defaultValue} (default)`
                            : f.placeholder
                      }
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  )}
                  <div className="mt-1.5 flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 text-xs text-grey">
                    {f.secret && f.isSet && !willClear && <span className="font-bold text-ok">✓ Saved (hidden)</span>}
                    {f.source === "env" && <span>Currently set by an environment variable — saving here overrides it.</span>}
                    {f.help && <span>{f.help}</span>}
                    {f.link && <ExternalLink href={f.link.href}>{f.link.text}</ExternalLink>}
                    {f.isSet && f.source === "admin" && (
                      <button
                        type="button"
                        className="cursor-pointer text-danger underline"
                        onClick={() => setClear(willClear ? clear.filter((k) => k !== f.key) : [...clear, f.key])}
                      >
                        {willClear ? "Undo remove" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {g.title.startsWith("E-mail") && (
              <button type="button" onClick={testEmail} disabled={dirty} className="btn-secondary cursor-pointer" title={dirty ? "Save first" : undefined}>
                Send test e-mail
              </button>
            )}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1 text-sm">
            {message ? (
              <span className={message.ok ? "text-ok" : "text-danger"}>{message.text}</span>
            ) : dirty ? (
              <span className="text-navy">You have unsaved settings</span>
            ) : (
              <span className="text-grey">Settings saved</span>
            )}
          </div>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setValues(initial);
                setClear([]);
              }}
              className="btn-secondary cursor-pointer px-4 py-2.5"
            >
              Discard
            </button>
          )}
          <button type="button" onClick={save} disabled={busy || !dirty} className="btn-primary cursor-pointer px-6 py-2.5">
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
