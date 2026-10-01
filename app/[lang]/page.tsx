import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CatalogBrowser, type CatalogItem } from "@/components/CatalogBrowser";
import { listProducts } from "@/lib/products";
import { listSections } from "@/lib/sections";
import { LOCALES, fmt, getDict, isLocale, tSection, tSeries } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])) } };
}

export default async function HomePage({ params, searchParams }: Props) {
  const { lang } = await params;
  const query = (await searchParams) ?? {};
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().toLowerCase() ?? "";
  if (!isLocale(lang)) notFound();
  const t = getDict(lang);
  const products = listProducts();
  const items: CatalogItem[] = products.map((p) => ({
    code: p.code,
    name: p.name,
    section: p.section,
    series: p.series,
    ip: p.ip,
    image: p.images[0]?.url ?? null,
  }));
  const sections = listSections()
    .map((s) => ({
      name: s.name,
      label: tSection(lang, s.name),
      count: items.filter((i) => i.section === s.name).length,
    }))
    .filter((s) => s.count > 0);

  return (
    <>
      <SiteHeader lang={lang} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/hero.jpg" alt="" className="h-48 w-full object-cover sm:h-72 lg:h-80" />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl">
          {t.home.title1}
          <br />
          {t.home.title2}
        </h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <p className="text-base font-bold leading-tight text-ink">
            {t.home.collection1}
            <br />
            {t.home.collection2}
          </p>
          <p className="text-sm text-grey">{fmt(t.home.stats, { n: items.length, s: sections.length })}</p>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <CatalogBrowser
          // Deep links like ?section=Moving%20Heads&series=P open the catalog filtered.
          initialSection={sections.find((s) => s.name.toLowerCase() === one(query.section))?.name ?? null}
          initialSeries={(["B", "S", "P"] as const).find((x) => x.toLowerCase() === one(query.series)) ?? null}
          items={items}
          sections={sections}
          lang={lang}
          t={t.browser}
          series={{ B: tSeries(lang, "Budget"), S: tSeries(lang, "Standard"), P: tSeries(lang, "Premium") }}
        />
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
