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
  }));
  const sections = SECTIONS.map((s) => ({
    ...s,
    count: items.filter((i) => i.section === s.name).length,
  })).filter((s) => s.count > 0);

  return (
    <>
      <SiteHeader />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/hero.jpg" alt="" className="h-48 w-full object-cover sm:h-72 lg:h-80" />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl">
          Product
          <br />
          Catalog
        </h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <p className="text-base font-bold leading-tight text-ink">
            2027
            <br />
            Collection
          </p>
          <p className="text-sm text-grey">
            {items.length} fixtures · {sections.length} sections · prices on request
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <CatalogBrowser items={items} sections={sections} />
      </main>
      <SiteFooter />
    </>
  );
}
