import { requireAdminApi } from "@/lib/auth";
import { config } from "@/lib/config";
import { uploadsDir } from "@/lib/db";
import { listProducts } from "@/lib/products";
import { buildCatalogPdf } from "@/lib/pdf/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const pdf = await buildCatalogPdf({
    products: listProducts(),
    siteUrl: config.siteUrl,
    company: config.company,
    imagePath: (file) => uploadsDir("images", file),
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="LUXIKO_Product_Catalog_2027.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
