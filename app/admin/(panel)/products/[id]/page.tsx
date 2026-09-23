import { notFound } from "next/navigation";
import { getProductById, SECTIONS, IP_RATINGS } from "@/lib/products";
import { consoleLogos } from "@/lib/settings";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = getProductById(Number((await params).id));
  if (!product) notFound();
  return (
    <ProductEditor
      initial={product}
      sections={SECTIONS.map((s) => s.name)}
      ipRatings={IP_RATINGS}
      logos={consoleLogos()}
    />
  );
}
