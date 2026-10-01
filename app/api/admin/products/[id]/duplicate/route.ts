import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { requireAdminApi } from "@/lib/auth";
import { db, uploadsDir } from "@/lib/db";
import { codeExists, createProduct, getProductById } from "@/lib/products";
import { safeName } from "@/lib/storage";

/** Copy a product (fields + photos, not library files) as a hidden draft. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const p = getProductById(Number((await ctx.params).id));
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });

  let code = `${p.code}-COPY`.slice(0, 40);
  for (let i = 2; codeExists(code); i++) code = `${p.code}-COPY${i}`.slice(0, 40);

  const id = createProduct({
    code,
    name: p.name,
    section: p.section,
    series: p.series,
    ip: p.ip,
    description: p.description,
    dmxModes: p.dmxModes,
    capabilities: p.capabilities,
    specs: p.specs,
    published: false,
    needsReview: p.needsReview,
  });
  const insert = db().prepare("INSERT INTO product_images (product_id, file, sort_order) VALUES (?, ?, ?)");
  p.images.forEach((img, i) => {
    const src = safeName(img.file);
    if (!src || !fs.existsSync(uploadsDir("images", src))) return;
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}${path.extname(src)}`;
    fs.copyFileSync(uploadsDir("images", src), uploadsDir("images", name));
    insert.run(id, name, i);
  });
  return Response.json({ id });
}
