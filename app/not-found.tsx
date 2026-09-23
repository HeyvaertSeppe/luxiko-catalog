import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="glow-bg mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white">This page doesn&apos;t exist</h1>
        <p className="mt-3 text-navy-300">The product may have been renamed or removed from the catalog.</p>
        <Link href="/" className="btn-primary mt-8">Browse the catalog</Link>
      </main>
    </>
  );
}
