import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";
import { DEFAULT_BRANDS, DEFAULT_SECTIONS } from "./defaults";

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;

let instance: Database.Database | null = null;

export function uploadsDir(...parts: string[]) {
  return path.join(config.dataDir, "uploads", ...parts);
}

const MIGRATIONS: string[] = [
  `
  CREATE TABLE products (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL DEFAULT '',
    section       TEXT NOT NULL DEFAULT '',
    series        TEXT,
    ip            TEXT NOT NULL DEFAULT 'IP N/A',
    description   TEXT NOT NULL DEFAULT '',
    dmx_modes     TEXT NOT NULL DEFAULT '[]',
    capabilities  TEXT NOT NULL DEFAULT '[]',
    specs         TEXT NOT NULL DEFAULT '[]',
    published     INTEGER NOT NULL DEFAULT 1,
    needs_review  INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE product_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file        TEXT NOT NULL,
    width       INTEGER,
    height      INTEGER,
    sort_order  INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_images_product ON product_images(product_id, sort_order);
  CREATE TABLE library_files (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    console        TEXT NOT NULL,
    file           TEXT NOT NULL,
    original_name  TEXT NOT NULL,
    size           INTEGER NOT NULL DEFAULT 0,
    uploaded_at    TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(product_id, console)
  );
  CREATE TABLE short_links (
    slug        TEXT PRIMARY KEY,
    product_id  INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    hits        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE quotes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_code  TEXT NOT NULL,
    name          TEXT NOT NULL,
    company       TEXT NOT NULL DEFAULT '',
    email         TEXT NOT NULL,
    phone         TEXT NOT NULL DEFAULT '',
    country       TEXT NOT NULL DEFAULT '',
    quantity      INTEGER NOT NULL DEFAULT 1,
    purpose       TEXT NOT NULL DEFAULT '',
    needed_by     TEXT NOT NULL DEFAULT '',
    message       TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'new',
    email_sent    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE settings (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
  );
  `,
  // 2: editable categories and library brands (were hard-coded)
  `
  CREATE TABLE sections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    prefix      TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0
  );
  ${DEFAULT_SECTIONS.map((s, i) => `INSERT INTO sections (name, prefix, sort_order) VALUES (${q(s.name)}, ${q(s.prefix)}, ${(i + 1) * 10});`).join("\n  ")}
  INSERT OR IGNORE INTO sections (name, prefix, sort_order)
    SELECT DISTINCT section, upper(substr(section, 1, 2)), 1000 FROM products WHERE section != '';

  CREATE TABLE library_brands (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    short       TEXT NOT NULL DEFAULT '',
    hint        TEXT NOT NULL DEFAULT '',
    accept      TEXT NOT NULL DEFAULT '',
    color       TEXT NOT NULL DEFAULT '#202a4b',
    text_color  TEXT NOT NULL DEFAULT '#ffffff',
    logo        TEXT,
    enabled     INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0
  );
  ${DEFAULT_BRANDS.map((b, i) => `INSERT INTO library_brands (slug, name, short, hint, accept, color, text_color, logo, sort_order) VALUES (${q(b.slug)}, ${q(b.name)}, ${q(b.short)}, ${q(b.hint)}, ${q(b.accept)}, ${q(b.color)}, ${q(b.textColor)}, (SELECT value FROM settings WHERE key = ${q("consoleLogo:" + b.slug)}), ${(i + 1) * 10});`).join("\n  ")}
  DELETE FROM settings WHERE key LIKE 'consoleLogo:%';
  `,
];

function migrate(db: Database.Database) {
  const version = db.pragma("user_version", { simple: true }) as number;
  for (let i = version; i < MIGRATIONS.length; i++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[i]);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
}

type SeedFile = {
  products: {
    code: string;
    name: string;
    section: string;
    series: string | null;
    ip: string;
    dmxModes: string[];
    capabilities: { label: string; enabled: boolean }[];
    specs: { label: string; value: string }[];
    image: string | null;
    sortOrder: number;
    needsReview: boolean;
  }[];
};

/** Version of the photos in seed/images (2 = AI-upscaled WebP). */
export const SEED_IMAGES_VERSION = 2;

/** Best photo for a product in seed/images (AI-upscaled WebP, else the original PNG). */
export function seedImageFor(code: string): string | null {
  for (const ext of [".webp", ".png"]) {
    const file = path.join(process.cwd(), "seed", "images", `${code}${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

export function seedImageName(code: string) {
  return `seed-${code.toLowerCase().replace(/[^a-z0-9-]/g, "_")}-v${SEED_IMAGES_VERSION}${seedImageFor(code)?.endsWith(".png") ? ".png" : ".webp"}`;
}

/** First start: import the products that were extracted from the original PDF. */
function seed(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;
  if (count > 0) return;
  const seedDir = path.join(process.cwd(), "seed");
  const file = path.join(seedDir, "products.json");
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as SeedFile;
  fs.mkdirSync(uploadsDir("images"), { recursive: true });

  const insert = db.prepare(`
    INSERT INTO products (code, name, section, series, ip, dmx_modes, capabilities, specs, needs_review, sort_order)
    VALUES (@code, @name, @section, @series, @ip, @dmx, @caps, @specs, @review, @sort)`);
  const insertImage = db.prepare(
    "INSERT INTO product_images (product_id, file, sort_order) VALUES (?, ?, 0)",
  );
  let allHq = true;
  db.transaction(() => {
    for (const p of data.products) {
      const res = insert.run({
        code: p.code,
        name: p.name,
        section: p.section,
        series: p.series,
        ip: p.ip,
        dmx: JSON.stringify(p.dmxModes),
        caps: JSON.stringify(p.capabilities),
        specs: JSON.stringify(p.specs),
        review: p.needsReview ? 1 : 0,
        sort: p.sortOrder * 10,
      });
      const src = seedImageFor(p.code);
      if (src && !src.endsWith(".webp")) allHq = false;
      if (src) {
        const name = seedImageName(p.code);
        fs.copyFileSync(src, uploadsDir("images", name));
        insertImage.run(res.lastInsertRowid, name);
      }
    }
  })();
  // Only mark the photos as up to date when the high-quality versions were used.
  if (allHq) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('seed:imagesVersion', ?)").run(String(SEED_IMAGES_VERSION));
  }
  console.log(`[luxiko] Seeded ${data.products.length} products from seed/products.json`);
}

export function db(): Database.Database {
  if (instance) return instance;
  fs.mkdirSync(config.dataDir, { recursive: true });
  const conn = new Database(path.join(config.dataDir, "luxiko.db"));
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.pragma("busy_timeout = 5000");
  migrate(conn);
  seed(conn);
  instance = conn;
  return conn;
}
