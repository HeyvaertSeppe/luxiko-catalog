import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";
import { IP_RATINGS, SECTIONS, SERIES_LABEL, sectionIndex, sectionSlug, type Product } from "../products";

/* ────────────────────────────────────────────────────────────────────────────
   LUXIKO printable catalog (A4), in the house style of the original 2027
   catalog: white pages, Open Sauce One headlines, League Spartan labels,
   navy table bars and orange accents. Specs are not printed — every product
   has a QR code that opens its page on the website.
   ──────────────────────────────────────────────────────────────────────────── */

type Company = { name: string; tagline: string; email: string; phone: string; address: string; vat: string };

export type CatalogOptions = {
  products: Product[];
  siteUrl: string;
  company: Company;
  year?: number;
  /** Resolves a stored image file name to a path on disk. */
  imagePath: (file: string) => string;
};

const W = 595.28;
const L = 20; // left edge used by titles and tables
const R = 575; // right edge

const C = {
  ink: "#111111",
  navy: "#202A4B",
  orange: "#F2AE1C",
  grey: "#8A8F9E",
  zebra: "#F5F6F9",
  hairline: "#E6E8EE",
  white: "#FFFFFF",
};

const ROWS_PER_PAGE = 6;
const ROW_PITCH = 110;
const FIRST_ROW = 146;

/** IP ratings used in a list, in catalog order (IP20 first, IP N/A last). */
function sortedIps(list: Product[]) {
  const order = (ip: string) => (IP_RATINGS.indexOf(ip) === -1 ? 99 : IP_RATINGS.indexOf(ip));
  return [...new Set(list.map((p) => p.ip))].sort((a, b) => order(a) - order(b));
}

function fontFile(pkg: string, file: string) {
  return path.join(process.cwd(), "node_modules/@fontsource", pkg, "files", file);
}

function registerFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont("Sauce", fontFile("open-sauce-one", "open-sauce-one-latin-400-normal.woff"));
  doc.registerFont("SauceBold", fontFile("open-sauce-one", "open-sauce-one-latin-700-normal.woff"));
  doc.registerFont("Spartan", fontFile("league-spartan", "league-spartan-latin-700-normal.woff"));
}

/** Loads a product photo on white and returns a print-sized JPEG (~300 dpi in the PDF). */
async function loadProductImage(file: string): Promise<Buffer | null> {
  try {
    const flat = await sharp(fs.readFileSync(file)).flatten({ background: "#ffffff" }).toBuffer();
    // Trim the white border around the product so it centres visually in its box.
    const trimmed = await sharp(flat)
      .trim({ background: "#ffffff", threshold: 20 })
      .toBuffer()
      .catch(() => flat);
    return await sharp(trimmed)
      .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}

function drawQr(doc: PDFKit.PDFDocument, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = size / n;
  doc.save();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) doc.rect(x + c * cell, y + r * cell, cell + 0.05, cell + 0.05);
    }
  }
  doc.fill(C.ink);
  doc.restore();
}

/** Letter-spaced League Spartan label, like "S E R I E S" in the original. */
function label(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  opts: PDFKit.Mixins.TextOptions = {},
) {
  doc.font("Spartan").fontSize(size).fillColor(color);
  doc.text(text.toUpperCase(), x, y, { characterSpacing: size * 0.28, lineBreak: false, ...opts });
  return doc.widthOfString(text.toUpperCase(), { characterSpacing: size * 0.28 });
}

export async function buildCatalogPdf(opts: CatalogOptions): Promise<Buffer> {
  const year = opts.year ?? 2027;
  const products = [...opts.products].sort(
    (a, b) => sectionIndex(a.section) - sectionIndex(b.section) || a.sortOrder - b.sortOrder,
  );
  const sections = [...new Set(products.map((p) => p.section))];
  const productUrl = (code: string) => `${opts.siteUrl}/p/${encodeURIComponent(code)}`;
  const siteLabel = opts.siteUrl.replace(/^https?:\/\//, "");

  const images = new Map<number, Buffer>();
  const queue = products.filter((p) => p.images[0]);
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        const buf = await loadProductImage(opts.imagePath(p.images[0].file));
        if (buf) images.set(p.id, buf);
      }
    }),
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    autoFirstPage: false,
    info: {
      Title: `${opts.company.name} Product Catalog ${year}`,
      Author: opts.company.name,
      Subject: "Stage lighting product catalogue",
    },
  });
  registerFonts(doc);
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const brand = (f: string) => path.join(process.cwd(), "public/brand", f);
  const logo = brand("logo-dark.png");
  const hero = brand("hero.jpg");
  let pageNo = 0; // printed page number; the cover is unnumbered

  function newPage() {
    doc.addPage({ size: "A4", margin: 0 });
  }

  function logoTopRight() {
    if (fs.existsSync(logo)) doc.image(logo, 461, 20, { width: 114 });
  }

  function footer(visible = true) {
    pageNo++;
    if (!visible) return;
    doc.moveTo(L, 806).lineTo(R, 806).lineWidth(0.4).stroke("#E3E5EC");
    doc.font("Sauce").fontSize(7.5).fillColor(C.grey);
    doc.text(`${opts.company.name.toUpperCase()}  ·  ${opts.company.tagline}  ·  Product Catalog ${year}`, L, 816, {
      lineBreak: false,
    });
    doc.font("SauceBold").fontSize(8.5).fillColor(C.navy);
    doc.text(String(pageNo), R - 40, 815.5, { width: 40, align: "right", lineBreak: false });
  }

  function pageTitle(lines: string[], suffix?: string) {
    doc.font("Sauce").fontSize(45).fillColor(C.ink);
    lines.forEach((line, i) => doc.text(line, L, 5 + i * 41, { lineBreak: false }));
    if (suffix) {
      const last = lines[lines.length - 1];
      const x = L + doc.font("Sauce").fontSize(45).widthOfString(last);
      doc.font("SauceBold").fontSize(33).fillColor(C.orange);
      doc.text(` ${suffix}`, x, 5 + (lines.length - 1) * 41 + 12, { lineBreak: false });
    }
  }

  /** Wraps a section name over two lines when it would run into the logo. */
  function titleLines(title: string, suffix: string) {
    doc.font("Sauce").fontSize(45);
    const full = doc.widthOfString(title) + doc.font("SauceBold").fontSize(33).widthOfString(` ${suffix}`);
    if (full < 430 || !title.includes(" ")) return [title];
    const words = title.split(" ");
    const last = words.pop()!;
    return [words.join(" "), last];
  }

  function tableBar(y: number, cols: [string, number][]) {
    doc.rect(L, y, R - L, 18).fill(C.navy);
    for (const [t, x] of cols) label(doc, t, x, y + 6, 8.5, C.white);
  }

  /* ── Cover ────────────────────────────────────────────────────────────── */
  newPage();
  if (fs.existsSync(hero)) doc.image(hero, 0, 0, { cover: [W, 385.4], align: "center", valign: "center" });
  doc.font("Sauce").fontSize(80).fillColor(C.ink);
  doc.text("Product", 62, 425, { lineBreak: false });
  doc.text("Catalog", 62, 496, { lineBreak: false });
  doc.font("SauceBold").fontSize(15).fillColor(C.ink);
  doc.text(String(year), 62, 722, { lineBreak: false });
  doc.text("Collection", 62, 741, { lineBreak: false });
  if (fs.existsSync(logo)) doc.image(logo, 357, 714, { width: 197 });

  /* ── How to read the codes ────────────────────────────────────────────── */
  newPage();
  logoTopRight();
  pageTitle(["How to read", "the codes"]);
  label(doc, "Code structure", 23, 116, 12, C.navy);
  doc.rect(L, 129, R - L, 62).fill(C.zebra);
  let x = 34;
  for (const [t, orange] of [["MV", false], ["S", true], ["720", false], ["S", true], ["1317", false]] as const) {
    doc.font("SauceBold").fontSize(30).fillColor(orange ? C.orange : C.navy).text(t, x, 137, { lineBreak: false });
    x += doc.widthOfString(t);
  }
  doc.font("Sauce").fontSize(9).fillColor(C.grey);
  doc.text("family   ·   series   ·   watts   ·   optic   ·   colour + gobo wheels", 34, 174, { lineBreak: false });

  const table = (y: number, head: [string, string], rows: [string, string][]) => {
    tableBar(y, [
      [head[0], 28],
      [head[1], 178],
    ]);
    let ry = y + 26;
    rows.forEach(([k, v], i) => {
      if (i % 2 === 1) doc.rect(L, ry - 1, R - L, 17).fill(C.zebra);
      doc.font("SauceBold").fontSize(10.5).fillColor(C.navy).text(k, 28, ry + 1.5, { lineBreak: false });
      doc.font("Sauce").fontSize(10.5).fillColor(C.ink).text(v, 178, ry + 1.5, { lineBreak: false });
      ry += 17;
    });
    return ry;
  };
  let y = table(
    225,
    ["Series", "What it means"],
    [
      ["B  ·  Budget", "Entry level. Lowest cost per fixture, indoor club and mobile DJ work."],
      ["S  ·  Standard", "Workhorse rental stock. Better build, brighter, more DMX modes."],
      ["P  ·  Premium", "Top of the range. Highest output, full feature set, mostly IP rated."],
    ],
  );
  y = table(y + 16, ["Optic letter", "Fixture type"], [
    ["B", "Beam — tight parallel beam, gobo and colour wheels"],
    ["W", "Wash — even soft field, no gobos"],
    ["H", "Hybrid — beam / spot / wash in one head"],
    ["Z", "Zoom — motorised zoom, LED multi-cell engine"],
    ["P", "Profile / Spot — shutter framing or fixed profile optics"],
    ["F", "Framing — full framing shutter system"],
    ["S", "Special — bar format, double sided or multi-head effect fixtures"],
    ["X", "General — no dedicated optic (flat par, strobe, machine, accessory)"],
  ]);
  y = table(y + 16, ["IP rating", "Where it can go"], [
    ["IP20", "Indoor only. No protection against water."],
    ["IP25", "Indoor. Protected against dripping water at an angle."],
    ["IP54", "Covered outdoor. Dust protected, splash proof."],
    ["IP56", "Covered outdoor. Dust protected, resists powerful jets."],
    ["IP65", "Outdoor. Dust tight and protected against water jets."],
    ["IP66", "Outdoor. Dust tight, protected against heavy seas and strong jets."],
    ["OUTDOOR", "Sold as outdoor by the manufacturer, but no IP number stated."],
    ["IP N/A", "No IP rating stated. Treat as indoor only until confirmed."],
  ]);
  y += 16;
  tableBar(y, [
    ["QR code", 28],
    ["What you get", 178],
  ]);
  drawQr(doc, opts.siteUrl, 28, y + 28, 62);
  doc.font("Sauce").fontSize(10.5).fillColor(C.ink);
  doc.text(
    "Every product has its own QR code. Scan it with your phone camera to see the full specifications, photos and DMX modes, download fixture libraries for grandMA2, grandMA3, ChamSys and Avolites, and request a quote.",
    178,
    y + 28,
    { width: R - 178, lineGap: 2.5 },
  );
  doc.font("SauceBold").fontSize(10.5).fillColor(C.navy).text(`Browse everything at ${siteLabel}`, 178, doc.y + 6, { lineBreak: false });
  doc.font("Sauce").fontSize(9).fillColor(C.grey);
  doc.text(
    "Pages run Budget, then Standard, then Premium, and inside each series from the lowest IP rating to the highest. Prices on request.",
    L,
    y + 104,
    { width: R - L },
  );
  footer();

  /* ── Contents (page numbers are filled in at the end) ─────────────────── */
  newPage();
  const contentsIndex = doc.bufferedPageRange().count - 1;
  footer();

  /* ── Sections ─────────────────────────────────────────────────────────── */
  const sectionStart = new Map<string, number>();
  const seriesOrder = ["B", "S", "P"] as const;

  sections.forEach((section, si) => {
    const meta = SECTIONS.find((s) => s.name === section) ?? { name: section, prefix: section.slice(0, 2).toUpperCase() };
    const list = products.filter((p) => p.section === section);
    const ips = sortedIps(list);
    const series = seriesOrder.filter((s) => list.some((p) => p.series === s)).map((s) => SERIES_LABEL[s]);

    /* Divider page */
    newPage();
    doc.addNamedDestination(`section-${si}`, "Fit");
    logoTopRight();
    sectionStart.set(section, pageNo + 1);
    doc.font("Sauce").fontSize(52).fillColor(C.ink).text(section, L, 244, { width: R - L, lineBreak: false });
    doc.font("SauceBold").fontSize(26).fillColor(C.orange).text(String(list.length), L, 316, { lineBreak: false });
    const nW = doc.widthOfString(String(list.length));
    label(doc, list.length === 1 ? "Fixture" : "Fixtures", L + nW + 10, 327, 15, C.navy);
    doc.moveTo(L, 362).lineTo(R, 362).lineWidth(1.2).stroke(C.navy);
    const facts: [string, string][] = [
      ["Series", series.join("   ·   ") || "—"],
      ["IP ratings", ips.join("   ·   ")],
      ["Code prefix", meta.prefix],
    ];
    facts.forEach(([k, v], i) => {
      label(doc, k, L, 384 + i * 46, 8.5, C.grey);
      doc.font("Sauce").fontSize(14).fillColor(C.navy).text(v, L, 396 + i * 46, { width: R - L, lineBreak: false });
    });
    const icon = brand(`icons/${sectionSlug(section)}.png`);
    if (fs.existsSync(icon)) doc.image(icon, 0, 662, { height: 180 });
    footer(false); // divider pages are numbered but, like the original, show no footer

    /* Product pages: one run per series + IP rating, like the original */
    const groups: { series: Product["series"]; ip: string; items: Product[] }[] = [];
    for (const p of list) {
      const g = groups[groups.length - 1];
      if (g && g.series === p.series && g.ip === p.ip) g.items.push(p);
      else groups.push({ series: p.series, ip: p.ip, items: [p] });
    }
    for (const g of groups) {
      for (let start = 0; start < g.items.length; start += ROWS_PER_PAGE) {
        newPage();
        logoTopRight();
        pageTitle(titleLines(section, g.ip), g.ip);
        const sw = label(doc, g.series ? `${SERIES_LABEL[g.series]} series` : "Collection", 23, 112, 21, C.navy);
        if (start > 0) label(doc, "Continued", 23 + sw + 14, 116, 15.1, C.orange);

        const rows = g.items.slice(start, start + ROWS_PER_PAGE);
        rows.forEach((p, i) => {
          const y0 = FIRST_ROW + i * ROW_PITCH;
          const cy = y0 + ROW_PITCH / 2; // everything in the row is centred on this line

          // Hairline between products
          if (i < rows.length - 1) {
            doc.moveTo(52, y0 + ROW_PITCH).lineTo(R, y0 + ROW_PITCH).lineWidth(0.4).stroke(C.hairline);
          }

          // Photo, centred in its box
          const img = images.get(p.id);
          if (img) doc.image(img, 52, cy - 44, { fit: [108, 88], align: "center", valign: "center" });

          // QR code + caption, centred on the row
          const qs = 74;
          const qx = R - qs - 30;
          const qy = cy - (qs + 12) / 2;
          drawQr(doc, productUrl(p.code), qx, qy, qs);
          label(doc, "Scan for specs", qx - 20, qy + qs + 6, 6.5, C.navy, { width: qs + 40, align: "center" });

          // Text block (code, type, link), vertically centred
          const tx = 178;
          const tw = qx - 20 - tx;
          doc.font("Sauce").fontSize(19.5);
          const codeH = doc.currentLineHeight();
          doc.font("SauceBold").fontSize(16);
          const nameH = Math.min(doc.heightOfString(p.name, { width: tw, lineGap: -1 }), 2 * doc.currentLineHeight());
          doc.font("Sauce").fontSize(9);
          const urlH = doc.currentLineHeight();
          const blockH = codeH + 2 + nameH + 5 + urlH;
          let ty = cy - blockH / 2;
          doc.font("Sauce").fontSize(19.5).fillColor(C.ink).text(p.code, tx, ty, { width: tw, lineBreak: false, ellipsis: true });
          ty += codeH + 2;
          doc.font("SauceBold").fontSize(16).fillColor(C.orange);
          doc.text(p.name, tx, ty, { width: tw, height: nameH + 1, lineGap: -1, ellipsis: true });
          ty += nameH + 5;
          doc.font("Sauce").fontSize(9).fillColor(C.grey);
          doc.text(`${siteLabel}/p/${p.code}`, tx, ty, { width: tw, lineBreak: false, ellipsis: true });

          doc.link(52, y0, R - 52, ROW_PITCH, productUrl(p.code));
        });
        footer();
      }
    }
  });

  /* ── Back page ────────────────────────────────────────────────────────── */
  newPage();
  logoTopRight();
  doc.font("Sauce").fontSize(52).fillColor(C.ink).text("Browse online", L, 244, { lineBreak: false });
  doc.font("SauceBold").fontSize(26).fillColor(C.orange).text(siteLabel, L, 316, { lineBreak: false });
  doc.moveTo(L, 362).lineTo(R, 362).lineWidth(1.2).stroke(C.navy);
  const back: [string, string][] = [["On every product page", "Full specifications  ·  Photos  ·  Console libraries  ·  Quotes"]];
  if (opts.company.email) back.push(["E-mail", opts.company.email]);
  if (opts.company.phone) back.push(["Phone", opts.company.phone]);
  if (opts.company.address) back.push(["Address", opts.company.address.replace(/\n/g, ", ")]);
  if (opts.company.vat) back.push(["VAT", opts.company.vat]);
  back.forEach(([k, v], i) => {
    label(doc, k, L, 384 + i * 46, 8.5, C.grey);
    doc.font("Sauce").fontSize(14).fillColor(C.navy).text(v, L, 396 + i * 46, { width: 400, lineBreak: false });
  });
  drawQr(doc, opts.siteUrl, R - 110, 384, 110);
  label(doc, "Scan to browse", R - 130, 504, 7, C.navy, { width: 150, align: "center" });
  doc.font("Sauce").fontSize(9).fillColor(C.grey);
  doc.text(`Prices on request. Specifications and images may change without notice.  © ${year} ${opts.company.name}`, L, 780, {
    lineBreak: false,
  });
  footer();

  /* ── Fill in the contents page ────────────────────────────────────────── */
  doc.switchToPage(contentsIndex);
  logoTopRight();
  pageTitle(["Contents"]);
  tableBar(84, [
    ["Code", 28],
    ["Section", 74],
    ["Items", 278],
    ["IP ratings", 333],
  ]);
  label(doc, "Page", R - 48, 90, 8.5, C.white, { width: 40, align: "right" });
  y = 108;
  sections.forEach((s, i) => {
    const meta = SECTIONS.find((m) => m.name === s);
    const list = products.filter((p) => p.section === s);
    if (i % 2 === 1) doc.rect(L, y - 3, R - L, 19).fill(C.zebra);
    doc.font("SauceBold").fontSize(11).fillColor(C.orange).text(meta?.prefix ?? "", 28, y, { lineBreak: false });
    doc.font("SauceBold").fontSize(11).fillColor(C.navy).text(s, 74, y, { lineBreak: false });
    doc.font("Sauce").fontSize(11).fillColor(C.ink).text(String(list.length), 278, y, { lineBreak: false });
    doc.font("Sauce").fontSize(9).fillColor(C.grey).text(sortedIps(list).join("  ·  "), 333, y + 2, {
      lineBreak: false,
    });
    doc.font("SauceBold").fontSize(11).fillColor(C.navy).text(String(sectionStart.get(s) ?? ""), R - 48, y, {
      width: 40,
      align: "right",
      lineBreak: false,
    });
    doc.goTo(L, y - 3, R - L, 19, `section-${i}`);
    y += 19;
  });
  doc.font("Sauce").fontSize(11).fillColor(C.grey);
  doc.text(`${products.length} fixtures   ·   ${sections.length} sections   ·   ${year} collection`, L, y + 12, { lineBreak: false });

  doc.end();
  return done;
}
