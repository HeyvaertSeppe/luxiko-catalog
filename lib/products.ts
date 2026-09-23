import { db } from "./db";
import type { ConsoleId } from "./consoles";

export type Spec = { label: string; value: string };
export type Capability = { label: string; enabled: boolean };

export type ProductImage = { id: number; file: string; url: string };
export type LibraryFile = {
  id: number;
  console: ConsoleId;
  originalName: string;
  size: number;
  uploadedAt: string;
  url: string;
};

export type Product = {
  id: number;
  code: string;
  name: string;
  section: string;
  series: "B" | "S" | "P" | null;
  ip: string;
  description: string;
  dmxModes: string[];
  capabilities: Capability[];
  specs: Spec[];
  published: boolean;
  needsReview: boolean;
  sortOrder: number;
  updatedAt: string;
  images: ProductImage[];
  libraries: LibraryFile[];
};

export const SERIES_LABEL: Record<string, string> = {
  B: "Budget",
  S: "Standard",
  P: "Premium",
};

/** Canonical section order, taken from the original catalog. */
export const SECTIONS = [
  { name: "Moving Heads", prefix: "MV" },
  { name: "PAR Cans", prefix: "PR" },
  { name: "LED & Pixel Bars", prefix: "BR" },
  { name: "Wash / City Colors", prefix: "WL" },
  { name: "Blinders", prefix: "BL" },
  { name: "Strobes", prefix: "ST" },
  { name: "Effect Lights", prefix: "FX" },
  { name: "Pinspots", prefix: "PS" },
  { name: "Profiles & Spots", prefix: "PF" },
  { name: "Fresnels", prefix: "FR" },
  { name: "Gobo Projectors", prefix: "GP" },
  { name: "Lasers", prefix: "LS" },
  { name: "Matrix Panels", prefix: "MX" },
  { name: "Tube Lights", prefix: "TB" },
  { name: "Mirror Balls", prefix: "MB" },
  { name: "Retro & Vintage", prefix: "RT" },
  { name: "Fog & Haze Machines", prefix: "FM" },
  { name: "Controllers", prefix: "CT" },
  { name: "Accessories", prefix: "AC" },
];

export const IP_RATINGS = ["IP20", "IP25", "IP54", "IP56", "IP65", "IP66", "OUTDOOR", "IP N/A"];

export function sectionSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Row = {
  id: number;
  code: string;
  name: string;
  section: string;
  series: string | null;
  ip: string;
  description: string;
  dmx_modes: string;
  capabilities: string;
  specs: string;
  published: number;
  needs_review: number;
  sort_order: number;
  updated_at: string;
};

function parse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function imageUrl(file: string) {
  return `/files/images/${encodeURIComponent(file)}`;
}

function hydrate(rows: Row[]): Product[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const images = db()
    .prepare(
      `SELECT id, product_id, file FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    )
    .all(...ids) as { id: number; product_id: number; file: string }[];
  const libs = db()
    .prepare(
      `SELECT id, product_id, console, original_name, size, uploaded_at FROM library_files WHERE product_id IN (${placeholders})`,
    )
    .all(...ids) as {
    id: number;
    product_id: number;
    console: ConsoleId;
    original_name: string;
    size: number;
    uploaded_at: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    section: r.section,
    series: (r.series as Product["series"]) || null,
    ip: r.ip,
    description: r.description,
    dmxModes: parse<string[]>(r.dmx_modes, []),
    capabilities: parse<Capability[]>(r.capabilities, []),
    specs: parse<Spec[]>(r.specs, []),
    published: r.published === 1,
    needsReview: r.needs_review === 1,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
    images: images
      .filter((i) => i.product_id === r.id)
      .map((i) => ({ id: i.id, file: i.file, url: imageUrl(i.file) })),
    libraries: libs
      .filter((l) => l.product_id === r.id)
      .map((l) => ({
        id: l.id,
        console: l.console,
        originalName: l.original_name,
        size: l.size,
        uploadedAt: l.uploaded_at,
        url: `/files/library/${l.id}/${encodeURIComponent(l.original_name)}`,
      })),
  }));
}

const SELECT = `SELECT id, code, name, section, series, ip, description, dmx_modes, capabilities, specs,
  published, needs_review, sort_order, updated_at FROM products`;

export function sectionIndex(section: string) {
  const i = SECTIONS.findIndex((s) => s.name === section);
  return i === -1 ? SECTIONS.length : i;
}

function sortProducts(list: Product[]) {
  return list.sort(
    (a, b) => sectionIndex(a.section) - sectionIndex(b.section) || a.sortOrder - b.sortOrder || a.code.localeCompare(b.code),
  );
}

export function listProducts(opts: { includeHidden?: boolean } = {}): Product[] {
  const rows = db()
    .prepare(`${SELECT} ${opts.includeHidden ? "" : "WHERE published = 1"}`)
    .all() as Row[];
  return sortProducts(hydrate(rows));
}

export function getProductByCode(code: string, opts: { includeHidden?: boolean } = {}): Product | null {
  const row = db()
    .prepare(`${SELECT} WHERE code = ? ${opts.includeHidden ? "" : "AND published = 1"}`)
    .get(code) as Row | undefined;
  return row ? hydrate([row])[0] : null;
}

export function getProductById(id: number): Product | null {
  const row = db().prepare(`${SELECT} WHERE id = ?`).get(id) as Row | undefined;
  return row ? hydrate([row])[0] : null;
}

export type ProductInput = {
  code: string;
  name: string;
  section: string;
  series: "B" | "S" | "P" | null;
  ip: string;
  description: string;
  dmxModes: string[];
  capabilities: Capability[];
  specs: Spec[];
  published: boolean;
  needsReview: boolean;
};

export function createProduct(input: ProductInput): number {
  const max = (db().prepare("SELECT COALESCE(MAX(sort_order), 0) AS m FROM products").get() as { m: number }).m;
  const res = db()
    .prepare(
      `INSERT INTO products (code, name, section, series, ip, description, dmx_modes, capabilities, specs, published, needs_review, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.code,
      input.name,
      input.section,
      input.series,
      input.ip,
      input.description,
      JSON.stringify(input.dmxModes),
      JSON.stringify(input.capabilities),
      JSON.stringify(input.specs),
      input.published ? 1 : 0,
      input.needsReview ? 1 : 0,
      max + 10,
    );
  return Number(res.lastInsertRowid);
}

export function updateProduct(id: number, input: ProductInput) {
  db()
    .prepare(
      `UPDATE products SET code = ?, name = ?, section = ?, series = ?, ip = ?, description = ?, dmx_modes = ?,
       capabilities = ?, specs = ?, published = ?, needs_review = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .run(
      input.code,
      input.name,
      input.section,
      input.series,
      input.ip,
      input.description,
      JSON.stringify(input.dmxModes),
      JSON.stringify(input.capabilities),
      JSON.stringify(input.specs),
      input.published ? 1 : 0,
      input.needsReview ? 1 : 0,
      id,
    );
}

export function touchProduct(id: number) {
  db().prepare("UPDATE products SET updated_at = datetime('now') WHERE id = ?").run(id);
}

export function codeExists(code: string, exceptId?: number) {
  const row = db()
    .prepare("SELECT id FROM products WHERE code = ? AND id != ?")
    .get(code, exceptId ?? -1);
  return Boolean(row);
}
