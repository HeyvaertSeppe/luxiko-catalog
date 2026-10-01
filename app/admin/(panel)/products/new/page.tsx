import { IP_RATINGS } from "@/lib/products";
import { listSections } from "@/lib/sections";
import { listBrands } from "@/lib/brands";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <ProductEditor
      initial={null}
      sections={listSections().map((s) => s.name)}
      ipRatings={IP_RATINGS}
      brands={listBrands()}
    />
  );
}
