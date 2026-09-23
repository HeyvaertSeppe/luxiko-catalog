import { SECTIONS, IP_RATINGS } from "@/lib/products";
import { consoleLogos } from "@/lib/settings";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <ProductEditor
      initial={null}
      sections={SECTIONS.map((s) => s.name)}
      ipRatings={IP_RATINGS}
      logos={consoleLogos()}
    />
  );
}
