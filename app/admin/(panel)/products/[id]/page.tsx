import { notFound } from "next/navigation";
import { getProductById, IP_RATINGS } from "@/lib/products";
import { listSections } from "@/lib/sections";
import { listBrands } from "@/lib/brands";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = getProductById(Number((await params).id));
  if (!product) notFound();
  return (
    <ProductEditor
      initial={product}
      sections={listSections().map((s) => s.name)}
      ipRatings={IP_RATINGS}
      brands={listBrands()}
    />
  );
}
