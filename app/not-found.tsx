import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70dvh] max-w-6xl flex-col justify-center px-4 sm:px-6">
        <p className="caps text-sm text-navy">404</p>
        <h1 className="mt-3 text-5xl tracking-tight text-ink">Page not found</h1>
        <p className="mt-3 text-navy">The product may have been renamed or removed from the catalog.</p>
        <Link href="/" className="btn-primary mt-8 self-start">Browse the catalog</Link>
      </main>
    </>
  );
}
