import crypto from "node:crypto";
import { db } from "./db";

// No 0/O, 1/I/L — easy to read and type on a PC.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomSlug(len = 5) {
  const bytes = crypto.randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

/** Returns the product's short link slug, creating one the first time. */
export function getOrCreateShortSlug(productId: number): string {
  const existing = db().prepare("SELECT slug FROM short_links WHERE product_id = ?").get(productId) as
    | { slug: string }
    | undefined;
  if (existing) return existing.slug;
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = randomSlug(attempt < 5 ? 5 : 6);
    const res = db()
      .prepare("INSERT OR IGNORE INTO short_links (slug, product_id) VALUES (?, ?)")
      .run(slug, productId);
    if (res.changes === 1) return slug;
    const again = db().prepare("SELECT slug FROM short_links WHERE product_id = ?").get(productId) as
      | { slug: string }
      | undefined;
    if (again) return again.slug;
  }
  throw new Error("Could not create short link");
}

export function resolveShortSlug(slug: string): string | null {
  const row = db()
    .prepare(
      "SELECT p.code FROM short_links s JOIN products p ON p.id = s.product_id WHERE s.slug = ? AND p.published = 1",
    )
    .get(slug.toUpperCase()) as { code: string } | undefined;
  if (row) db().prepare("UPDATE short_links SET hits = hits + 1 WHERE slug = ?").run(slug.toUpperCase());
  return row?.code ?? null;
}
