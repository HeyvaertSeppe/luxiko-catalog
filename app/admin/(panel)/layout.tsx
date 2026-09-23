import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogoutIcon } from "@/components/icons";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const newQuotes = (db().prepare("SELECT COUNT(*) AS n FROM quotes WHERE status = 'new'").get() as { n: number }).n;

  return (
    <div className="min-h-dvh bg-navy-950">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-light.png" alt="LUXIKO" className="h-8 w-auto" />
            <span className="hidden rounded-md bg-amber-brand/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-brand sm:inline">
              Admin
            </span>
          </Link>
          <AdminNav newQuotes={newQuotes} />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden text-sm text-navy-300 hover:text-white md:inline">
              View site ↗
            </Link>
            {session.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" title={session.email} />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold" title={session.email}>
                {session.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <form action="/api/auth/logout" method="post">
              <button className="cursor-pointer rounded-lg p-2 text-navy-300 hover:bg-white/5 hover:text-white" title="Sign out" aria-label="Sign out">
                <LogoutIcon width={18} height={18} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
