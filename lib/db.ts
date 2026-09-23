import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";

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
      if (p.image) {
        const src = path.join(seedDir, "images", p.image);
        if (fs.existsSync(src)) {
          const name = `seed-${p.image.toLowerCase()}`;
          fs.copyFileSync(src, uploadsDir("images", name));
          insertImage.run(res.lastInsertRowid, name);
        }
      }
    }
  })();
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
