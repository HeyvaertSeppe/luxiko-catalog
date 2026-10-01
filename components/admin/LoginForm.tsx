"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);
    if (res?.ok) {
      window.location.href = "/admin";
      return;
    }
    const json = res ? await res.json().catch(() => ({})) : {};
    setError((json as { error?: string }).error ?? "Could not reach the server.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="field-label" htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" required className="field" autoCapitalize="none" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {error && <p className="border-l-4 border-danger bg-zebra px-3 py-2 text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full cursor-pointer">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
