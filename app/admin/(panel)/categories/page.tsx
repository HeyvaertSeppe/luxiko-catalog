import { db } from "@/lib/db";
import { listSections } from "@/lib/sections";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  const counts = Object.fromEntries(
    (db().prepare("SELECT section, COUNT(*) AS n FROM products GROUP BY section").all() as { section: string; n: number }[]).map((r) => [
      r.section,
      r.n,
    ]),
  );
  const sections = listSections().map((s) => ({ ...s, products: counts[s.name] ?? 0 }));
  return (
    <div className="pb-10">
      <h1 className="text-4xl tracking-tight text-ink">Categories</h1>
      <p className="mt-1 max-w-2xl text-sm text-grey">
        The sections of the website and the PDF, in this order. Renaming a category moves its products along. Only empty categories can be deleted.
      </p>
      <CategoriesManager sections={sections} />
    </div>
  );
}
