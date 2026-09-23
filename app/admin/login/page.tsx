import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  denied: "This Google account is not allowed to open the admin. Add it to ADMIN_EMAILS in .env.local.",
  state: "Sign-in expired or was interrupted. Please try again.",
  google: "Google sign-in failed. Please try again.",
  config: "Google sign-in is not configured yet. Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession()) redirect("/admin");
  const { error } = await searchParams;
  const notConfigured = !config.googleClientId || config.authSecret.length < 32;

  return (
    <main className="glow-bg flex min-h-dvh items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8 text-center shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-light.png" alt="LUXIKO" className="mx-auto h-12 w-auto" />
        <h1 className="mt-8 font-display text-xl font-semibold text-white">Catalog admin</h1>
        <p className="mt-2 text-sm text-navy-300">Sign in with your Google account to manage products, files and quotes.</p>
        {error && ERRORS[error] && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-200">{ERRORS[error]}</p>
        )}
        {notConfigured && (
          <p className="mt-5 rounded-xl border border-amber-brand/30 bg-amber-brand/10 px-3 py-2 text-left text-sm text-amber-soft">
            Setup needed: fill in AUTH_SECRET, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in <code>.env.local</code> and restart.
          </p>
        )}
        <a
          href="/api/auth/google"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-navy-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Sign in with Google
        </a>
      </div>
    </main>
  );
}
