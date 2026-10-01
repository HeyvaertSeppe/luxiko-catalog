import { db } from "@/lib/db";
import { listBrands } from "@/lib/brands";
import { BrandsManager } from "@/components/admin/BrandsManager";

export const dynamic = "force-dynamic";

export default function BrandsPage() {
  const counts = Object.fromEntries(
    (db().prepare("SELECT console, COUNT(*) AS n FROM library_files GROUP BY console").all() as { console: string; n: number }[]).map(
      (r) => [r.console, r.n],
    ),
  );
  const brands = listBrands().map((b) => ({ ...b, files: counts[b.slug] ?? 0 }));
  return (
    <div className="pb-10">
      <h1 className="text-4xl tracking-tight text-ink">Library brands</h1>
      <p className="mt-1 max-w-2xl text-sm text-grey">
        The consoles you offer fixture libraries for. Each brand gets its own coloured download button with its logo on the product pages —
        but only for products where you uploaded a file (Products → edit → Console libraries). Files are stored on your own server.
      </p>
      <BrandsManager brands={brands} />
    </div>
  );
}
