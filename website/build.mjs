#!/usr/bin/env node
// Builds the upload-ready website in website/public_html.
//   node website/build.mjs
// Only needs Node.js (no npm install). Edit texts in website/src/content.mjs.

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { categories, languages, marquee, settings } from "./src/content.mjs";
import { DIR, LANGS, homePage, notFoundPage } from "./src/page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "public_html");
const assets = join(out, "assets");

function write(rel, content) {
  const file = join(out, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log("  wrote", rel);
}

function copy(from, rel, { optional = false } = {}) {
  const src = join(root, from);
  if (!existsSync(src)) {
    if (optional) return console.warn("  skipped (not found):", from);
    throw new Error(`Missing ${from}`);
  }
  const dest = join(out, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

console.log("Building the LUXIKO website…");

// Brand images, fonts and product photos come from the catalog project.
copy("public/brand/logo-light.png", "assets/img/logo-light.png");
copy("public/brand/logo-dark.png", "assets/img/logo-dark.png");
copy("public/brand/icon.png", "assets/img/icon.png");
for (const [pkg, file, name] of [
  ["open-sauce-one", "open-sauce-one-latin-400-normal.woff2", "open-sauce-one-400.woff2"],
  ["open-sauce-one", "open-sauce-one-latin-700-normal.woff2", "open-sauce-one-700.woff2"],
  ["league-spartan", "league-spartan-latin-700-normal.woff2", "league-spartan-700.woff2"],
]) {
  // Fonts are already in public_html; only refreshed when node_modules is there.
  copy(`node_modules/@fontsource/${pkg}/files/${file}`, `assets/fonts/${name}`, { optional: true });
}
for (const code of new Set([...categories.map((c) => c.img), ...marquee])) {
  copy(`seed/images/${code}.webp`, `assets/img/products/${code}.webp`);
}
copy("catalog/LUXIKO_Product_Catalog_2027.pdf", "downloads/LUXIKO_Product_Catalog_2027.pdf", { optional: true });

// Cache-busting version for the CSS / JS
const version = createHash("sha256")
  .update(readFileSync(join(assets, "site.css")))
  .update(readFileSync(join(assets, "site.js")))
  .digest("hex")
  .slice(0, 10);
const finish = (html) => html.replace(/__V__/g, version);

for (const lang of LANGS) write(`${DIR[lang]}index.html`, finish(homePage(lang, languages[lang])));
write("404.html", finish(notFoundPage(languages.en)));

const site = settings.siteUrl.replace(/\/+$/, "");
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.map(
  (l) => `  <url>
    <loc>${site}/${DIR[l]}</loc>
${LANGS.map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${site}/${DIR[a]}"/>`).join("\n")}
  </url>`,
).join("\n")}
</urlset>
`,
);

console.log(`Done. Upload everything inside ${out}`);
