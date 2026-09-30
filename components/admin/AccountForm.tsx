"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountForm({ username, viaGoogle }: { username: string; viaGoogle: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (data.newPassword !== data.confirm) {
      setMessage({ ok: false, text: "The new passwords do not match." });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: data.username, currentPassword: data.currentPassword, newPassword: data.newPassword }),
    }).catch(() => null);
    const json = (res ? await res.json().catch(() => ({})) : {}) as { error?: string };
    setBusy(false);
    if (!res?.ok) {
      setMessage({ ok: false, text: json.error ?? "Could not save" });
      return;
    }
    form.reset();
    setMessage({ ok: true, text: "Password changed. Other sessions are signed out." });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="acc-user">Username</label>
        <input id="acc-user" name="username" defaultValue={username} required minLength={3} autoComplete="username" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="acc-current">Current password</label>
        <input id="acc-current" name="currentPassword" type="password" required autoComplete="current-password" className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="acc-new">New password</label>
        <input id="acc-new" name="newPassword" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="acc-confirm">Repeat new password</label>
        <input id="acc-confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <p className="text-xs text-grey sm:col-span-2">
        At least 10 characters.{viaGoogle && " You are signed in with Google; you still need the current admin password to change it."}
      </p>
      {message && <p className={`text-sm sm:col-span-2 ${message.ok ? "text-ok" : "text-danger"}`}>{message.text}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="btn-primary cursor-pointer">
          {busy ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
