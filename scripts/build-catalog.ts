/**
 * Builds the printable catalog PDF from the database.
 *
 *   npm run catalog:pdf                      -> catalog/LUXIKO_Product_Catalog_2027.pdf
 *   npm run catalog:pdf -- --out my.pdf
 *
 * QR codes point to the website address from Admin → Settings (SITE_URL).
 */
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { config } = await import("../lib/config");
const { uploadsDir } = await import("../lib/db");
const { listProducts } = await import("../lib/products");
const { buildCatalogPdf } = await import("../lib/pdf/catalog");
const { upgradeSeedImages } = await import("../lib/bootstrap");

const outArg = process.argv.indexOf("--out");
const out = path.resolve(outArg > -1 ? process.argv[outArg + 1] : "catalog/LUXIKO_Product_Catalog_2027.pdf");

const started = Date.now();
await upgradeSeedImages();
const products = listProducts();
const pdf = await buildCatalogPdf({
  products,
  siteUrl: config.siteUrl,
  company: config.company,
  imagePath: (file) => uploadsDir("images", file),
});
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, pdf);
console.log(
  `Catalog written to ${path.relative(process.cwd(), out)} — ${products.length} products, ${(pdf.length / 1024 / 1024).toFixed(1)} MB, QR codes -> ${config.siteUrl} (${Date.now() - started} ms)`,
);
