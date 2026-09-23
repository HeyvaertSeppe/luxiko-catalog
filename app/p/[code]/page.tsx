import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductGallery } from "@/components/ProductGallery";
import { QuoteButton } from "@/components/QuoteDialog";
import { ShareButton } from "@/components/ShareDialog";
import { ArrowLeftIcon, CheckIcon, DownloadIcon, XIcon } from "@/components/icons";
import { CONSOLES } from "@/lib/consoles";
import { SERIES_LABEL, getProductByCode, listProducts } from "@/lib/products";
import { consoleLogos } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

const IP_TEXT: Record<string, string> = {
  IP20: "Indoor use",
  IP25: "Indoor, drip protected",
  IP54: "Covered outdoor, splash proof",
  IP56: "Covered outdoor, jet resistant",
  IP65: "Outdoor, dust tight & water jets",
  IP66: "Outdoor, heavy weather",
  OUTDOOR: "Outdoor rated by manufacturer",
  "IP N/A": "Treat as indoor only",
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
    .slice(0, 4);

  return (
    <>
      <SiteHeader>
        <Link href="/" className="btn-ghost hidden px-4 py-2 sm:inline-flex">
          <ArrowLeftIcon width={16} height={16} /> All products
        </Link>
      </SiteHeader>

      <main className="glow-bg pb-28 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
          <nav className="mb-5 flex items-center gap-2 text-sm text-navy-300" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Catalog</Link>
            <span>/</span>
            <span className="text-navy-200">{product.section}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
            <ProductGallery images={product.images} alt={`${product.code} ${product.name}`} ip={product.ip} />

            <div className="flex flex-col">
              <div className="flex flex-wrap gap-2">
                {product.series && (
                  <span className="chip border-amber-brand/40 bg-amber-brand/10 text-amber-brand">
                    {SERIES_LABEL[product.series]} series
                  </span>
                )}
                <span className="chip">{product.section}</span>
                <span className="chip">{product.ip}</span>
              </div>
              <h1 className="mt-4 break-words font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {product.code}
              </h1>
              <p className="mt-2 text-lg font-semibold uppercase tracking-wide text-amber-brand sm:text-xl">
                {product.name}
              </p>
              {product.description && (
                <p className="mt-5 whitespace-pre-line leading-relaxed text-navy-200">{product.description}</p>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-3">
                <div className="card p-4">
                  <dt className="text-xs uppercase tracking-wider text-navy-300">Protection</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-white">{product.ip}</dd>
                  <dd className="text-xs text-navy-300">{IP_TEXT[product.ip] ?? ""}</dd>
                </div>
                <div className="card p-4">
                  <dt className="text-xs uppercase tracking-wider text-navy-300">DMX modes</dt>
                  <dd className="mt-1 truncate font-display text-xl font-semibold text-white">
                    {product.dmxModes.length ? product.dmxModes.filter((m) => !m.startsWith("+")).join(" / ") : "—"}
                  </dd>
                  <dd className="text-xs text-navy-300">
                    {product.dmxModes.length
                      ? `${product.dmxModes.length} mode${product.dmxModes.length === 1 ? "" : "s"}${product.dmxModes.some((m) => m.startsWith("+")) ? " (more on request)" : ""}`
                      : "On request"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 hidden gap-3 lg:flex">
                <QuoteButton code={product.code} name={product.name} image={product.images[0]?.url} className="btn-primary flex-1 py-4 text-base" />
                <ShareButton code={product.code} className="btn-ghost py-4" />
              </div>

              {downloads.length > 0 && (
                <section className="mt-8">
                  <h2 className="eyebrow mb-3">Console libraries</h2>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {downloads.map(({ c, file }) => (
                      <a
                        key={c.id}
                        href={file!.url}
                        download
                        className="group card flex items-center gap-3 p-3 transition hover:border-amber-brand/50 hover:bg-navy-850"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logos[c.id].url} alt={`${c.name} logo`} className={logos[c.id].custom ? "h-9 w-9 object-contain" : "h-12 w-12"} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{c.name}</span>
                          <span className="block truncate text-xs text-navy-300">
                            {file!.originalName} · {formatSize(file!.size)}
                          </span>
                        </span>
                        <DownloadIcon className="shrink-0 text-navy-300 transition group-hover:text-amber-brand" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {product.capabilities.length > 0 && (
              <section className="card p-5 sm:p-6">
                <h2 className="eyebrow mb-4">Features</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {product.capabilities.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                        c.enabled
                          ? "border-amber-brand/30 bg-amber-brand/10 text-white"
                          : "border-white/5 bg-white/[0.02] text-navy-300/70 line-through decoration-navy-500"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${c.enabled ? "bg-amber-brand text-navy-950" : "bg-white/5 text-navy-500"}`}
                      >
                        {c.enabled ? <CheckIcon width={12} height={12} strokeWidth={3} /> : <XIcon width={11} height={11} strokeWidth={3} />}
                      </span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={`card p-5 sm:p-6 ${product.capabilities.length ? "" : "lg:col-span-2"}`}>
              <h2 className="eyebrow mb-2">Specifications</h2>
              <dl className="divide-y divide-white/5">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3 text-sm">
                  <dt className="text-navy-300">Model</dt>
                  <dd className="font-medium text-white">{product.code}</dd>
                </div>
                {product.dmxModes.length > 0 && (
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3 text-sm">
                    <dt className="text-navy-300">DMX channels</dt>
                    <dd className="font-medium text-white">{product.dmxModes.join(" / ")}</dd>
                  </div>
                )}
                {product.specs.map((s, i) => (
                  <div key={`${s.label}-${i}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3 text-sm">
                    <dt className="text-navy-300">{s.label}</dt>
                    <dd className="break-words font-medium text-white">{s.value}</dd>
                  </div>
                ))}
              </dl>
              {product.specs.length === 0 && product.dmxModes.length === 0 && (
                <p className="py-3 text-sm text-navy-300">Full specifications available on request.</p>
              )}
            </section>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold text-white">More {product.section.toLowerCase()}</h2>
                <Link href="/" className="text-sm text-navy-300 hover:text-white">View catalog →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {related.map((p) => (
                  <Link key={p.id} href={`/p/${encodeURIComponent(p.code)}`} className="group card overflow-hidden transition hover:border-amber-brand/40">
                    <div className="product-stage relative aspect-[4/3]">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt={p.code} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate font-display text-sm font-semibold text-white">{p.code}</div>
                      <div className="truncate text-[11px] font-semibold uppercase text-amber-brand">{p.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sticky action bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-950/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <QuoteButton code={product.code} name={product.name} image={product.images[0]?.url} className="btn-primary flex-1 py-3.5 text-base" />
          <ShareButton code={product.code} className="btn-ghost px-4 py-3.5" compact />
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
