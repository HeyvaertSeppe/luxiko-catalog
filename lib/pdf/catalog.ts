import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";
import { SECTIONS, SERIES_LABEL, sectionIndex, type Product } from "../products";

/* ────────────────────────────────────────────────────────────────────────────
   LUXIKO printable catalog (A4). Products show photo, code, type, series,
   IP rating and a QR code linking to the product page — full specs live on
   the website.
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
const H = 841.89;
const M = 40; // page margin

const C = {
  navy950: "#070B18",
  navy900: "#0B1124",
  navy800: "#151E3A",
  navy: "#202A4B",
  navy500: "#414F7D",
  navy300: "#8E97B8",
  line: "#E3E6EF",
  paper: "#F5F6FA",
  white: "#FFFFFF",
  orange: "#F2AE1C",
  ink: "#111526",
  muted: "#6B7190",
};

const FONT_DIR = () => path.join(process.cwd(), "node_modules/@fontsource");
const BRAND_DIR = () => path.join(process.cwd(), "public/brand");

function registerFonts(doc: PDFKit.PDFDocument) {
  const f = FONT_DIR();
  doc.registerFont("Display", path.join(f, "sora/files/sora-latin-600-normal.woff"));
  doc.registerFont("DisplayBold", path.join(f, "sora/files/sora-latin-700-normal.woff"));
  doc.registerFont("DisplayLight", path.join(f, "sora/files/sora-latin-300-normal.woff"));
  doc.registerFont("Body", path.join(f, "inter/files/inter-latin-400-normal.woff"));
  doc.registerFont("BodyMedium", path.join(f, "inter/files/inter-latin-500-normal.woff"));
  doc.registerFont("BodySemi", path.join(f, "inter/files/inter-latin-600-normal.woff"));
  doc.registerFont("BodyBold", path.join(f, "inter/files/inter-latin-700-normal.woff"));
}

/** Loads a product photo, trims its white border and returns a PNG buffer. */
async function loadProductImage(file: string): Promise<Buffer | null> {
  try {
    const input = fs.readFileSync(file);
    const trimmed = await sharp(input)
      .flatten({ background: "#ffffff" })
      .trim({ background: "#ffffff", threshold: 18 })
      .toBuffer()
      .catch(() => sharp(input).flatten({ background: "#ffffff" }).toBuffer());
    return await sharp(trimmed)
      .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

function drawQr(doc: PDFKit.PDFDocument, text: string, x: number, y: number, size: number, color = C.ink) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = size / n;
  doc.save();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // Slight overlap avoids hairline gaps between modules in some viewers.
      if (qr.modules.get(r, c)) doc.rect(x + c * cell, y + r * cell, cell + 0.05, cell + 0.05);
    }
  }
  doc.fill(color);
  doc.restore();
}

function spaced(doc: PDFKit.PDFDocument, text: string, x: number, y: number, opts: PDFKit.Mixins.TextOptions = {}) {
  doc.text(text, x, y, { characterSpacing: 1.6, lineBreak: false, ...opts });
}

/** Font size at which `text` fits in `width`, between min and max. */
function fitSize(doc: PDFKit.PDFDocument, text: string, font: string, width: number, max: number, min: number) {
  doc.font(font);
  for (let s = max; s > min; s -= 0.25) {
    if (doc.fontSize(s).widthOfString(text) <= width) return s;
  }
  return min;
}

function chip(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  opts: { bg: string; fg: string; border?: string; size?: number },
) {
  const size = opts.size ?? 6.2;
  doc.font("BodyBold").fontSize(size);
  const w = doc.widthOfString(text, { characterSpacing: 0.6 }) + 10;
  const h = size + 7;
  doc.roundedRect(x, y, w, h, h / 2).fill(opts.bg);
  if (opts.border) doc.roundedRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5, h / 2).lineWidth(0.5).stroke(opts.border);
  doc.fillColor(opts.fg).text(text, x + 5, y + 3.6, { characterSpacing: 0.6, lineBreak: false });
  return w;
}

export async function buildCatalogPdf(opts: CatalogOptions): Promise<Buffer> {
  const year = opts.year ?? 2027;
  const products = [...opts.products].sort(
    (a, b) => sectionIndex(a.section) - sectionIndex(b.section) || a.sortOrder - b.sortOrder,
  );
  const sections = [...new Set(products.map((p) => p.section))];
  const productUrl = (code: string) => `${opts.siteUrl}/p/${encodeURIComponent(code)}`;
  const siteLabel = opts.siteUrl.replace(/^https?:\/\//, "");

  // Preload + trim product photos (in parallel, bounded).
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
      Keywords: "stage lighting, moving heads, LED, catalog",
    },
  });
  registerFonts(doc);
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const logoLight = path.join(BRAND_DIR(), "logo-light.png");
  const logoDark = path.join(BRAND_DIR(), "logo-dark.png");
  const hero = path.join(BRAND_DIR(), "hero.jpg");
  let pageNo = 0;

  function newPage(bg = C.white) {
    doc.addPage({ size: "A4", margin: 0 });
    pageNo++;
    doc.rect(0, 0, W, H).fill(bg);
  }

  function footer(dark = false) {
    const y = H - 30;
    doc.moveTo(M, y - 10).lineTo(W - M, y - 10).lineWidth(0.5).stroke(dark ? "#26304F" : C.line);
    doc.font("BodyMedium").fontSize(7).fillColor(dark ? C.navy300 : C.muted);
    doc.text(`${opts.company.name.toUpperCase()}  ·  ${opts.company.tagline}  ·  Product Catalog ${year}`, M, y, {
      lineBreak: false,
    });
    doc.text("Prices on request  ·  Scan any QR code for full specs & a quote", M, y, {
      width: W - 2 * M - 30,
      align: "right",
      lineBreak: false,
    });
    doc.font("BodyBold").fontSize(8).fillColor(dark ? C.white : C.navy);
    doc.text(String(pageNo).padStart(2, "0"), W - M - 20, y - 0.5, { width: 20, align: "right", lineBreak: false });
  }

  /* ── 1. Cover ─────────────────────────────────────────────────────────── */
  newPage(C.navy950);
  const heroH = H * 0.64;
  if (fs.existsSync(hero)) doc.image(hero, 0, 0, { cover: [W, heroH], align: "center", valign: "center" });
  const g1 = doc.linearGradient(0, heroH * 0.35, 0, heroH);
  g1.stop(0, C.navy950, 0).stop(1, C.navy950, 1);
  doc.rect(0, 0, W, heroH + 1).fill(g1);
  const g2 = doc.linearGradient(0, 0, 0, 120);
  g2.stop(0, C.navy950, 0.55).stop(1, C.navy950, 0);
  doc.rect(0, 0, W, 120).fill(g2);
  if (fs.existsSync(logoLight)) doc.image(logoLight, M, 34, { height: 46 });
  doc.font("BodySemi").fontSize(8).fillColor(C.white);
  spaced(doc, `COLLECTION ${year}`, W - M - 140, 52, { width: 140, align: "right" });

  let y = heroH - 62;
  doc.rect(M, y, 34, 3).fill(C.orange);
  doc.font("BodySemi").fontSize(9).fillColor(C.orange);
  spaced(doc, "PRODUCT CATALOG", M, y + 14);
  doc.font("DisplayBold").fontSize(50).fillColor(C.white);
  doc.text("Stage lighting,", M, y + 34, { lineBreak: false });
  doc.fillColor(C.orange).text("built to perform.", M, y + 94, { lineBreak: false });
  doc.font("Body").fontSize(11.5).fillColor("#C7CCE0");
  doc.text(
    "Moving heads, PARs, bars, strobes, lasers, effects and more — for clubs, rental companies, venues and touring.",
    M,
    y + 166,
    { width: 360, lineGap: 3 },
  );

  // Stats row
  const stats: [string, string][] = [
    [String(products.length), "fixtures"],
    [String(sections.length), "categories"],
    ["3", "series"],
  ];
  let sx = M;
  const statY = H - 128;
  for (const [n, l] of stats) {
    doc.font("DisplayBold").fontSize(26).fillColor(C.white).text(n, sx, statY, { lineBreak: false });
    doc.font("BodyMedium").fontSize(8.5).fillColor(C.navy300);
    spaced(doc, l.toUpperCase(), sx, statY + 34);
    sx += 110;
  }
  doc.moveTo(M, H - 62).lineTo(W - M, H - 62).lineWidth(0.5).stroke("#26304F");
  doc.font("BodySemi").fontSize(9).fillColor(C.white).text(siteLabel, M, H - 46, { lineBreak: false });
  doc.font("Body").fontSize(9).fillColor(C.navy300);
  doc.text(opts.company.tagline, M, H - 46, { width: W - 2 * M, align: "right", lineBreak: false });

  /* ── 2. How to use this catalog ───────────────────────────────────────── */
  newPage(C.white);
  const pageHeading = (eyebrow: string, title: string) => {
    doc.rect(M, 54, 26, 3).fill(C.orange);
    doc.font("BodySemi").fontSize(8.5).fillColor(C.orange);
    spaced(doc, eyebrow, M, 66);
    doc.font("DisplayBold").fontSize(30).fillColor(C.navy).text(title, M, 82, { lineBreak: false });
    if (fs.existsSync(logoDark)) doc.image(logoDark, W - M - 96, 50, { height: 36 });
  };
  pageHeading("WELCOME", "How to use this catalog");

  // Big QR explainer panel
  y = 150;
  doc.roundedRect(M, y, W - 2 * M, 190, 16).fill(C.navy900);
  doc.roundedRect(M + 24, y + 24, 142, 142, 12).fill(C.white);
  drawQr(doc, opts.siteUrl, M + 36, y + 36, 118, C.navy950);
  let tx = M + 190;
  doc.font("BodySemi").fontSize(8).fillColor(C.orange);
  spaced(doc, "SCAN · VIEW · REQUEST", tx, y + 30);
  doc.font("DisplayBold").fontSize(18).fillColor(C.white);
  doc.text("Every product has its own QR code.", tx, y + 46, { width: 290 });
  const headH = doc.heightOfString("Every product has its own QR code.", { width: 290 });
  doc.font("Body").fontSize(9.5).fillColor("#C7CCE0");
  doc.text(
    "Point your phone camera at it to open the product page with full specifications, photos and DMX modes. Download fixture libraries for grandMA2, grandMA3, ChamSys MagicQ and Avolites Tiger Touch, and request a price with one tap.",
    tx,
    y + 54 + headH,
    { width: 290, lineGap: 2.2 },
  );
  const bodyEnd = doc.y;
  doc.font("BodySemi").fontSize(9).fillColor(C.orange).text(`Or browse everything at ${siteLabel}`, tx, Math.max(bodyEnd + 10, y + 150), { width: 290 });

  // Three steps
  y = 370;
  const steps: [string, string, string][] = [
    ["01", "Scan", "Open your phone camera and point it at the QR code next to the product."],
    ["02", "Explore", "See every specification, extra photos and download console libraries."],
    ["03", "Request a quote", "Tap the quote button, fill in the quantity and we reply fast."],
  ];
  const stepW = (W - 2 * M - 24) / 3;
  steps.forEach(([n, t, d], i) => {
    const x = M + i * (stepW + 12);
    doc.roundedRect(x, y, stepW, 118, 12).fill(C.paper);
    doc.font("DisplayBold").fontSize(22).fillColor(C.orange).text(n, x + 16, y + 16, { lineBreak: false });
    doc.font("Display").fontSize(12.5).fillColor(C.navy).text(t, x + 16, y + 50, { width: stepW - 32 });
    doc.font("Body").fontSize(8.8).fillColor(C.muted).text(d, x + 16, y + 70, { width: stepW - 32, lineGap: 1.5 });
  });

  // Series
  y = 520;
  doc.font("Display").fontSize(15).fillColor(C.navy).text("Three series, one standard", M, y);
  const series: [string, string, string][] = [
    ["B", "Budget", "Entry level. Lowest cost per fixture for clubs, bars and mobile DJs."],
    ["S", "Standard", "Workhorse rental stock. Better build, brighter output, more DMX modes."],
    ["P", "Premium", "Top of the range. Highest output, full feature set, mostly IP rated."],
  ];
  y += 30;
  series.forEach(([l, t, d], i) => {
    const x = M + i * (stepW + 12);
    doc.roundedRect(x, y, stepW, 124, 12).lineWidth(0.8).stroke(C.line);
    doc.roundedRect(x + 16, y + 16, 30, 30, 8).fill(i === 2 ? C.orange : C.navy);
    doc.font("DisplayBold").fontSize(15).fillColor(i === 2 ? C.navy : C.white).text(l, x + 16, y + 22.5, { width: 30, align: "center" });
    doc.font("Display").fontSize(12.5).fillColor(C.navy).text(`${t} series`, x + 16, y + 58, { width: stepW - 32 });
    doc.font("Body").fontSize(8.8).fillColor(C.muted).text(d, x + 16, y + 77, { width: stepW - 32, lineGap: 1.5 });
  });
  doc.font("Body").fontSize(9).fillColor(C.muted);
  doc.text(
    "Within each category, products are listed Budget, Standard, then Premium, and from the lowest to the highest IP rating. All prices on request.",
    M,
    712,
    { width: W - 2 * M, lineGap: 2 },
  );
  footer();

  /* ── 3. Reading the codes ─────────────────────────────────────────────── */
  newPage(C.white);
  pageHeading("REFERENCE", "Reading the product codes");
  y = 150;
  doc.roundedRect(M, y, W - 2 * M, 150, 16).fill(C.paper);
  const parts: [string, string, boolean][] = [
    ["MV", "Family", false],
    ["S", "Series", true],
    ["720", "Watts", false],
    ["S", "Optic", true],
    ["1317", "Colour + gobo wheels", false],
  ];
  const GAPX = 16;
  doc.font("DisplayBold").fontSize(44);
  const totalW = parts.reduce((s, [t]) => s + doc.widthOfString(t), 0) + (parts.length - 1) * GAPX;
  let px = (W - totalW) / 2;
  for (const [t, label, accent] of parts) {
    doc.font("DisplayBold").fontSize(44);
    const w = doc.widthOfString(t);
    doc.fillColor(accent ? C.orange : C.navy).text(t, px, y + 30, { lineBreak: false });
    doc.moveTo(px, y + 92).lineTo(px + w, y + 92).lineWidth(2).stroke(accent ? C.orange : C.navy);
    doc.font("BodySemi").fontSize(7).fillColor(C.muted);
    doc.text(label.toUpperCase(), px - GAPX / 2 + 1, y + 102, { width: w + GAPX - 2, align: "center", characterSpacing: 0.6 });
    px += w + GAPX;
  }

  const colW = (W - 2 * M - 20) / 2;
  const legend = (title: string, rows: [string, string][], x: number, y0: number) => {
    doc.font("Display").fontSize(14).fillColor(C.navy).text(title, x, y0);
    let ry = y0 + 28;
    for (const [k, v] of rows) {
      doc.roundedRect(x, ry, 58, 22, 6).fill(C.navy);
      doc.font("BodyBold").fontSize(8).fillColor(C.white).text(k, x, ry + 7, { width: 58, align: "center", lineBreak: false });
      doc.font("Body").fontSize(8.6).fillColor(C.ink).text(v, x + 68, ry + 2, { width: colW - 68, lineGap: 1 });
      ry += 34;
    }
  };
  legend(
    "Optic letter",
    [
      ["B", "Beam — tight parallel beam, gobo and colour wheels"],
      ["W", "Wash — even soft field, no gobos"],
      ["H", "Hybrid — beam / spot / wash in one head"],
      ["Z", "Zoom — motorised zoom, LED multi-cell engine"],
      ["P", "Profile / Spot — shutter framing or fixed profile optics"],
      ["F", "Framing — full framing shutter system"],
      ["S", "Special — bar format, double sided or multi-head effects"],
      ["X", "General — no dedicated optic (flat par, strobe, machine, accessory)"],
    ],
    M,
    330,
  );
  legend(
    "IP rating",
    [
      ["IP20", "Indoor only. No protection against water."],
      ["IP25", "Indoor. Protected against dripping water at an angle."],
      ["IP54", "Covered outdoor. Dust protected, splash proof."],
      ["IP56", "Covered outdoor. Dust protected, resists powerful jets."],
      ["IP65", "Outdoor. Dust tight, protected against water jets."],
      ["IP66", "Outdoor. Dust tight, heavy seas and strong jets."],
      ["OUTDOOR", "Sold as outdoor by the maker, no IP number stated."],
      ["IP N/A", "No IP rating stated. Treat as indoor only."],
    ],
    M + colW + 20,
    330,
  );
  footer();

  /* ── 4. Contents (filled in once page numbers are known) ──────────────── */
  newPage(C.white);
  const contentsPage = pageNo - 1;
  footer();

  /* ── 5. Sections ──────────────────────────────────────────────────────── */
  const sectionStart = new Map<string, number>();
  const CARD_H = 150;
  const GAP = 12;
  const CARD_W = (W - 2 * M - GAP) / 2;
  const TOP = 104;
  const BOTTOM = H - 52;

  function productPageHeader(section: string, prefix: string) {
    newPage(C.paper);
    doc.rect(0, 0, W, 78).fill(C.white);
    doc.moveTo(0, 78).lineTo(W, 78).lineWidth(0.5).stroke(C.line);
    doc.roundedRect(M, 28, 30, 22, 6).fill(C.navy);
    doc.font("BodyBold").fontSize(8.5).fillColor(C.orange).text(prefix, M, 35, { width: 30, align: "center", lineBreak: false });
    doc.font("Display").fontSize(19).fillColor(C.navy).text(section, M + 40, 28.5, { lineBreak: false });
    if (fs.existsSync(logoDark)) doc.image(logoDark, W - M - 80, 24, { height: 30 });
    footer();
  }

  function seriesHeader(label: string, y0: number) {
    doc.font("BodyBold").fontSize(8).fillColor(C.navy);
    spaced(doc, `${label.toUpperCase()} SERIES`, M, y0);
    const w = doc.widthOfString(`${label.toUpperCase()} SERIES`, { characterSpacing: 1.6 });
    doc.moveTo(M + w + 10, y0 + 4).lineTo(W - M, y0 + 4).lineWidth(0.5).stroke("#D5D9E6");
  }

  function card(p: Product, x: number, y0: number) {
    doc.roundedRect(x, y0, CARD_W, CARD_H, 12).fill(C.white);
    doc.roundedRect(x + 0.25, y0 + 0.25, CARD_W - 0.5, CARD_H - 0.5, 12).lineWidth(0.5).stroke(C.line);

    // Photo
    const box = { x: x + 10, y: y0 + 10, w: 116, h: CARD_H - 20 };
    doc.roundedRect(box.x, box.y, box.w, box.h, 8).fill("#F7F8FB");
    const img = images.get(p.id);
    if (img) {
      doc.image(img, box.x + 8, box.y + 8, { fit: [box.w - 16, box.h - 16], align: "center", valign: "center" });
    }
    chip(doc, p.ip, box.x + 6, box.y + 6, { bg: C.navy, fg: C.orange, size: 5.8 });

    // Text column
    const cx = box.x + box.w + 12;
    const cw = x + CARD_W - 12 - cx;
    const codeSize = fitSize(doc, p.code, "DisplayBold", cw, 14, 8.5);
    doc.font("DisplayBold").fontSize(codeSize).fillColor(C.navy).text(p.code, cx, y0 + 14, { lineBreak: false });
    doc.font("BodyBold").fontSize(7.2).fillColor(C.orange);
    doc.text(p.name.toUpperCase(), cx, y0 + 16 + codeSize + 2, { width: cw, height: 20, lineGap: 0.5, ellipsis: true, characterSpacing: 0.2 });
    if (p.series) {
      chip(doc, SERIES_LABEL[p.series].toUpperCase(), box.x + 6, box.y + box.h - 18, {
        bg: p.series === "P" ? C.orange : C.white,
        fg: C.navy,
        border: p.series === "P" ? undefined : C.line,
        size: 5.6,
      });
    }

    // QR
    const qs = 62;
    const qx = x + CARD_W - 12 - qs;
    const qy = y0 + CARD_H - 12 - qs - 9;
    drawQr(doc, productUrl(p.code), qx, qy, qs, C.navy950);
    doc.font("BodyBold").fontSize(5.2).fillColor(C.muted);
    doc.text("SCAN FOR SPECS", qx - 10, qy + qs + 3.5, { width: qs + 20, align: "center", characterSpacing: 0.6, lineBreak: false });
    doc.link(x, y0, CARD_W, CARD_H, productUrl(p.code));
  }

  sections.forEach((section, si) => {
    const meta = SECTIONS.find((s) => s.name === section) ?? { name: section, prefix: section.slice(0, 2).toUpperCase() };
    const list = products.filter((p) => p.section === section);

    /* Section opener */
    newPage(C.navy950);
    sectionStart.set(section, pageNo);
    doc.addNamedDestination(`section-${si}`, "Fit");
    const glow = doc.radialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, 360);
    glow.stop(0, C.orange, 0.22).stop(1, C.orange, 0);
    doc.rect(0, 0, W, H).fill(glow);
    doc.font("DisplayBold").fontSize(300).fillColor(C.white).fillOpacity(0.04);
    doc.text(meta.prefix, M - 12, 60, { lineBreak: false });
    doc.fillOpacity(1);
    if (fs.existsSync(logoLight)) doc.image(logoLight, M, 40, { height: 34 });
    doc.font("DisplayBold").fontSize(13).fillColor(C.orange);
    doc.text(String(si + 1).padStart(2, "0"), W - M - 60, 48, { width: 60, align: "right", lineBreak: false });

    y = 330;
    doc.rect(M, y, 34, 3).fill(C.orange);
    doc.font("BodySemi").fontSize(9).fillColor(C.orange);
    spaced(doc, `CATEGORY · ${meta.prefix}`, M, y + 14);
    const titleSize = fitSize(doc, section, "DisplayBold", W - 2 * M, 54, 30);
    doc.font("DisplayBold").fontSize(titleSize).fillColor(C.white).text(section, M, y + 34, { width: W - 2 * M });
    doc.font("Body").fontSize(12).fillColor("#C7CCE0");
    const seriesIn = (["B", "S", "P"] as const).filter((s) => list.some((p) => p.series === s)).map((s) => SERIES_LABEL[s]);
    const ipsIn = [...new Set(list.map((p) => p.ip))];
    doc.text(`${list.length} fixture${list.length === 1 ? "" : "s"}  ·  ${seriesIn.join(" · ")}`, M, y + 44 + titleSize * 1.15, {
      lineBreak: false,
    });
    let chipX = M;
    for (const ip of ipsIn) {
      chipX += chip(doc, ip, chipX, y + 72 + titleSize * 1.15, { bg: "#18213F", fg: C.white, border: "#2D3A64", size: 7 }) + 6;
    }

    // Preview tiles
    const picks = list.filter((p) => images.has(p.id)).slice(0, 3);
    const tileW = (W - 2 * M - 24) / 3;
    picks.forEach((p, i) => {
      const tx0 = M + i * (tileW + 12);
      const ty0 = H - 250;
      doc.roundedRect(tx0, ty0, tileW, 160, 14).fill(C.white);
      doc.image(images.get(p.id)!, tx0 + 14, ty0 + 14, { fit: [tileW - 28, 112], align: "center", valign: "center" });
      doc.font("Display").fontSize(9).fillColor(C.navy).text(p.code, tx0 + 14, ty0 + 134, { width: tileW - 28, lineBreak: false, ellipsis: true });
    });
    footer(true);

    /* Product pages */
    productPageHeader(section, meta.prefix);
    y = TOP;
    let col = 0;
    let currentSeries: string | null | undefined = undefined;
    for (const p of list) {
      const needsHeader = p.series !== currentSeries;
      if (needsHeader && col === 1) {
        col = 0;
        y += CARD_H + GAP;
      }
      const headerH = needsHeader && p.series ? 22 : 0;
      if (col === 0 && y + headerH + CARD_H > BOTTOM) {
        productPageHeader(section, meta.prefix);
        y = TOP;
      }
      if (needsHeader) {
        if (p.series) {
          seriesHeader(SERIES_LABEL[p.series], y);
          y += headerH;
        }
        currentSeries = p.series;
      }
      card(p, M + col * (CARD_W + GAP), y);
      if (col === 1) {
        col = 0;
        y += CARD_H + GAP;
      } else col = 1;
    }
  });

  /* ── 6. Back cover ────────────────────────────────────────────────────── */
  newPage(C.navy950);
  const glow = doc.radialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, 420);
  glow.stop(0, C.orange, 0.18).stop(1, C.orange, 0);
  doc.rect(0, 0, W, H).fill(glow);
  if (fs.existsSync(logoLight)) doc.image(logoLight, (W - 220) / 2, 120, { width: 220 });
  doc.font("DisplayBold").fontSize(26).fillColor(C.white).text("Ready when you are.", 0, 260, { width: W, align: "center" });
  doc.font("Body").fontSize(11).fillColor("#C7CCE0");
  doc.text("Scan to browse the full catalog online, download console libraries and request a quote.", W / 2 - 170, 298, {
    width: 340,
    align: "center",
    lineGap: 3,
  });
  doc.roundedRect(W / 2 - 80, 360, 160, 160, 16).fill(C.white);
  drawQr(doc, opts.siteUrl, W / 2 - 66, 374, 132, C.navy950);
  doc.font("BodySemi").fontSize(12).fillColor(C.orange).text(siteLabel, 0, 540, { width: W, align: "center" });

  const contact = [opts.company.email, opts.company.phone].filter(Boolean).join("   ·   ");
  y = 610;
  if (contact) {
    doc.font("BodyMedium").fontSize(11).fillColor(C.white).text(contact, 0, y, { width: W, align: "center" });
    y += 22;
  }
  if (opts.company.address) {
    doc.font("Body").fontSize(9.5).fillColor(C.navy300).text(opts.company.address, 0, y, { width: W, align: "center" });
    y += 18;
  }
  if (opts.company.vat) {
    doc.font("Body").fontSize(9).fillColor(C.navy300).text(`VAT ${opts.company.vat}`, 0, y, { width: W, align: "center" });
  }
  doc.font("Body").fontSize(7.5).fillColor(C.navy500);
  doc.text(
    `© ${year} ${opts.company.name}. All prices on request. Specifications and images may change without notice.`,
    0,
    H - 46,
    { width: W, align: "center" },
  );

  /* ── Fill in the contents page ────────────────────────────────────────── */
  doc.switchToPage(contentsPage);
  pageNo = contentsPage + 1;
  pageHeading("CONTENTS", "What's inside");
  y = 150;
  const rowH = (H - 110 - y) / Math.max(sections.length, 17);
  sections.forEach((s, i) => {
    const meta = SECTIONS.find((x) => x.name === s);
    const count = products.filter((p) => p.section === s).length;
    const ry = y + i * rowH;
    const mid = ry + rowH / 2;
    if (i % 2 === 0) doc.roundedRect(M - 8, ry + 2, W - 2 * M + 16, rowH - 4, 8).fill(C.paper);
    doc.roundedRect(M, mid - 10, 32, 20, 6).fill(C.navy);
    doc.font("BodyBold").fontSize(8).fillColor(C.orange).text(meta?.prefix ?? "", M, mid - 4, { width: 32, align: "center", lineBreak: false });
    doc.font("Display").fontSize(12.5).fillColor(C.navy).text(s, M + 46, mid - 8, { lineBreak: false });
    doc.font("Body").fontSize(9).fillColor(C.muted).text(`${count} fixture${count === 1 ? "" : "s"}`, W - M - 170, mid - 5.5, {
      width: 100,
      align: "right",
      lineBreak: false,
    });
    const target = sectionStart.get(s) ?? 0;
    doc.font("DisplayBold").fontSize(12).fillColor(C.navy).text(String(target).padStart(2, "0"), W - M - 50, mid - 7.5, {
      width: 50,
      align: "right",
      lineBreak: false,
    });
    doc.goTo(M - 8, ry + 2, W - 2 * M + 16, rowH - 4, `section-${i}`);
  });
  doc.font("Body").fontSize(9).fillColor(C.muted);
  doc.text(`${products.length} fixtures  ·  ${sections.length} categories  ·  ${year} collection`, M, H - 86, {
    width: W - 2 * M,
    align: "center",
  });

  doc.end();
  return done;
}
