import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogBrowser, type CatalogItem } from "@/components/CatalogBrowser";
import { SECTIONS, listProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const products = listProducts();
  const items: CatalogItem[] = products.map((p) => ({
    code: p.code,
    name: p.name,
    section: p.section,
    series: p.series,
    ip: p.ip,
    image: p.images[0]?.url ?? null,
    libraries: p.libraries.length,
  }));
  const sections = SECTIONS.map((s) => ({
    ...s,
    count: items.filter((i) => i.section === s.name).length,
  })).filter((s) => s.count > 0);

  return (
    <>
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/hero.jpg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/30 via-navy-950/70 to-navy-950" />
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <p className="eyebrow">2027 Collection</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Stage lighting,<br />
            <span className="text-amber-brand">built to perform.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-navy-200 sm:text-lg">
            {items.length} fixtures across {sections.length} categories. Open any product for full specifications,
            console libraries and an instant quote.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <CatalogBrowser items={items} sections={sections} />
      </main>
      <SiteFooter />
    </>
  );
}
