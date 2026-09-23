import Link from "next/link";
import { listProducts, SECTIONS } from "@/lib/products";
import { PlusIcon } from "@/components/icons";
import { ProductTable, type AdminRow } from "@/components/admin/ProductTable";
import { missingSettings } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const products = listProducts({ includeHidden: true });
  const rows: AdminRow[] = products.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    section: p.section,
    series: p.series,
    ip: p.ip,
    image: p.images[0]?.url ?? null,
    imageCount: p.images.length,
    libraries: p.libraries.map((l) => l.console),
    published: p.published,
    needsReview: p.needsReview,
    updatedAt: p.updatedAt,
  }));
  const stats = [
    { label: "Products", value: rows.length },
    { label: "Published", value: rows.filter((r) => r.published).length },
    { label: "Need review", value: rows.filter((r) => r.needsReview).length, warn: true },
    { label: "With libraries", value: rows.filter((r) => r.libraries.length > 0).length },
  ];
  const missing = missingSettings();

  return (
    <div>
      {missing.length > 0 && (
        <div className="mb-6 border border-orange bg-zebra p-4 text-sm text-navy">
          <strong>Setup incomplete:</strong> {missing.join(", ")}. Fill these in <code>.env.local</code> and restart —
          see <Link href="/admin/settings" className="underline">Settings</Link>.
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl tracking-tight text-ink">Products</h1>
          <p className="mt-1 text-sm text-grey">Edit specs, photos and console library files. Changes are live immediately.</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <PlusIcon width={18} height={18} /> New product
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4">
            <div className="text-xs uppercase tracking-wider text-grey">{s.label}</div>
            <div className={`mt-1 text-3xl ${s.warn && s.value ? "text-orange-dark" : "text-ink"}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <ProductTable rows={rows} sections={SECTIONS.map((s) => s.name)} />
    </div>
  );
}
