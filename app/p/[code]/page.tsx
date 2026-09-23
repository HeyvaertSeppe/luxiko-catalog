import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductGallery } from "@/components/ProductGallery";
import { QuoteButton } from "@/components/QuoteDialog";
import { ShareButton } from "@/components/ShareDialog";
import { ArrowLeftIcon, DownloadIcon } from "@/components/icons";
import { CONSOLES } from "@/lib/consoles";
import { SERIES_LABEL, getProductByCode, listProducts } from "@/lib/products";
import { consoleLogos } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

const IP_TEXT: Record<string, string> = {
  IP20: "Indoor only",
  IP25: "Indoor, protected against dripping water",
  IP54: "Covered outdoor, splash proof",
  IP56: "Covered outdoor, resists powerful jets",
  IP65: "Outdoor, dust tight, protected against water jets",
  IP66: "Outdoor, heavy weather",
  OUTDOOR: "Sold as outdoor, no IP number stated",
  "IP N/A": "No IP rating stated, treat as indoor",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const p = getProductByCode(decodeURIComponent(code));
  if (!p) return { title: "Product not found" };
  const description = `${p.code} — ${p.name}. ${p.section}, ${p.ip}. Specifications, console libraries and quote request.`;
  return {
    title: `${p.code} ${p.name}`,
    description,
    openGraph: { title: `${p.code} · ${p.name}`, description, images: p.images[0] ? [p.images[0].url] : [] },
  };
}

function Table({ head, rows }: { head: [string, string]; rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <div>
      <div className="bar grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        <span>{head[0]}</span>
        <span>{head[1]}</span>
      </div>
      <dl>
        {rows.map(([k, v], i) => (
          <div key={i} className={`grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-3 py-2 text-[15px] ${i % 2 ? "bg-zebra" : ""}`}>
            <dt className="font-bold text-navy">{k}</dt>
            <dd className="break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const { code } = await params;
  const product = getProductByCode(decodeURIComponent(code));
  if (!product) notFound();

  const logos = consoleLogos();
  const downloads = CONSOLES.map((c) => ({ c, file: product.libraries.find((l) => l.console === c.id) })).filter(
    (d) => d.file,
  );
  const related = listProducts()
    .filter((p) => p.section === product.section && p.id !== product.id)
    .sort((a, b) => Number(b.series === product.series) - Number(a.series === product.series))
    .slice(0, 6);

  const overview: [string, React.ReactNode][] = [
    ["Section", product.section],
    ...(product.series ? ([["Series", `${SERIES_LABEL[product.series]}`]] as [string, string][]) : []),
    [
      "IP rating",
      <>
        {product.ip} <span className="text-grey">· {IP_TEXT[product.ip] ?? ""}</span>
      </>,
    ],
    ["DMX modes", product.dmxModes.length ? product.dmxModes.join(" / ") : "On request"],
  ];

  return (
    <>
      <SiteHeader>
        <Link href="/" className="btn-secondary hidden px-4 py-2 sm:inline-flex">
          <ArrowLeftIcon width={16} height={16} /> Catalog
        </Link>
      </SiteHeader>

      <main className="pb-28 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
          <nav className="mb-6 text-sm text-grey" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-navy">Catalog</Link>
            <span className="mx-2">/</span>
            <span className="text-navy">{product.section}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
            <ProductGallery images={product.images} alt={`${product.code} ${product.name}`} />

            <div>
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="caps text-lg text-navy sm:text-xl">
                  {product.series ? `${SERIES_LABEL[product.series]} series` : product.section}
                </span>
                <span className="text-xl font-bold text-orange">{product.ip}</span>
              </p>
              <h1 className="mt-3 break-words text-4xl tracking-tight text-ink sm:text-5xl">{product.code}</h1>
              <p className="mt-1 text-2xl font-bold text-orange">{product.name}</p>
              {product.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-navy">{product.description}</p>}

              <div className="mt-8">
                <Table head={["Overview", ""]} rows={overview} />
              </div>

              <div className="mt-8 hidden gap-3 lg:flex">
                <QuoteButton code={product.code} name={product.name} image={product.images[0]?.url} className="btn-primary flex-1 py-4" />
                <ShareButton code={product.code} className="btn-secondary px-6 py-4" />
              </div>
            </div>
          </div>

          {downloads.length > 0 && (
            <section className="mt-14">
              <div className="bar grid grid-cols-[1fr_auto]">
                <span>Console libraries</span>
                <span>Download</span>
              </div>
              <ul>
                {downloads.map(({ c, file }, i) => (
                  <li key={c.id} className={i % 2 ? "bg-zebra" : ""}>
                    <a href={file!.url} download className="group flex items-center gap-4 px-3 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logos[c.id].url} alt={`${c.name} logo`} className="h-10 w-10 shrink-0 object-contain" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-navy">{c.name}</span>
                        <span className="block truncate text-sm text-grey">
                          {file!.originalName} · {formatSize(file!.size)}
                        </span>
                      </span>
                      <span className="caps flex shrink-0 items-center gap-2 text-[11px] text-navy group-hover:text-orange-dark">
                        <DownloadIcon width={18} height={18} />
                        <span className="hidden sm:inline">Download</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-14 grid gap-10 lg:grid-cols-[3fr_2fr]">
            <section>
              {product.specs.length > 0 ? (
                <Table head={["Specification", "Value"]} rows={product.specs.map((s) => [s.label, s.value])} />
              ) : (
                <>
                  <div className="bar">Specification</div>
                  <p className="px-3 py-3 text-grey">Full specifications available on request.</p>
                </>
              )}
            </section>
            {product.capabilities.length > 0 && (
              <section>
                <Table
                  head={["Feature", "Available"]}
                  rows={product.capabilities.map((c) => [
                    c.label,
                    c.enabled ? <span className="font-bold text-navy">Yes</span> : <span className="text-grey">No</span>,
                  ])}
                />
              </section>
            )}
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <div className="border-b border-navy pb-3">
                <h2 className="text-3xl tracking-tight text-ink sm:text-4xl">More {product.section}</h2>
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <li key={p.id} className="border-b border-line">
                    <Link href={`/p/${encodeURIComponent(p.code)}`} className="group flex items-center gap-4 py-4">
                      <span className="flex h-20 w-28 shrink-0 items-center justify-center">
                        {p.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt={p.code} loading="lazy" className="max-h-20 max-w-28 object-contain" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xl text-ink group-hover:underline">{p.code}</span>
                        <span className="block truncate font-bold text-orange">{p.name}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* Fixed action bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <QuoteButton code={product.code} name={product.name} image={product.images[0]?.url} className="btn-primary flex-1 py-3.5" />
          <ShareButton code={product.code} className="btn-secondary px-4 py-3.5" compact />
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
