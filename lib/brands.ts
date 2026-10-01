import { db } from "./db";

export type Brand = {
  id: number;
  slug: string;
  name: string;
  short: string;
  hint: string;
  accept: string;
  color: string;
  textColor: string;
  logoUrl: string | null;
  enabled: boolean;
  sortOrder: number;
};

type Row = {
  id: number;
  slug: string;
  name: string;
  short: string;
  hint: string;
  accept: string;
  color: string;
  text_color: string;
  logo: string | null;
  enabled: number;
  sort_order: number;
};

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function map(r: Row): Brand {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    short: r.short || r.name.slice(0, 3).toUpperCase(),
    hint: r.hint,
    accept: r.accept,
    // Colours are validated on save; fall back if anything odd is stored.
    color: HEX_COLOR.test(r.color) ? r.color : "#202a4b",
    textColor: HEX_COLOR.test(r.text_color) ? r.text_color : "#ffffff",
    logoUrl: r.logo ? `/files/consoles/${encodeURIComponent(r.logo)}` : null,
    enabled: r.enabled === 1,
    sortOrder: r.sort_order,
  };
}

export function listBrands(opts: { enabledOnly?: boolean } = {}): Brand[] {
  const rows = db()
    .prepare(`SELECT * FROM library_brands ${opts.enabledOnly ? "WHERE enabled = 1" : ""} ORDER BY sort_order, id`)
    .all() as Row[];
  return rows.map(map);
}

export function getBrand(idOrSlug: number | string): (Brand & { logo: string | null }) | null {
  const row = (
    typeof idOrSlug === "number"
      ? db().prepare("SELECT * FROM library_brands WHERE id = ?").get(idOrSlug)
      : db().prepare("SELECT * FROM library_brands WHERE slug = ?").get(idOrSlug)
  ) as Row | undefined;
  return row ? { ...map(row), logo: row.logo } : null;
}

/** Extensions a brand accepts (".xml,.zip" → [".xml", ".zip"]); empty = anything. */
export function acceptedExtensions(brand: Pick<Brand, "accept">) {
  return brand.accept
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^\.[a-z0-9]{1,10}$/.test(e));
}

export function brandSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "brand";
  let slug = base;
  for (let i = 2; db().prepare("SELECT 1 FROM library_brands WHERE slug = ?").get(slug); i++) slug = `${base}-${i}`;
  return slug;
}
