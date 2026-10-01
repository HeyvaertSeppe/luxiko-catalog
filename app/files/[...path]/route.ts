import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { db, uploadsDir } from "@/lib/db";
import { safeName } from "@/lib/storage";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function notFound() {
  return new Response("Not found", { status: 404 });
}

function stream(file: string) {
  return Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
}

/**
 * Serves uploaded files:
 *   /files/images/<file>           product photos
 *   /files/consoles/<file>         console logos
 *   /files/library/<id>/<name>     fixture library downloads
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const [kind, a] = parts;

  if ((kind === "images" || kind === "consoles") && parts.length === 2) {
    const name = safeName(decodeURIComponent(a));
    if (!name) return notFound();
    const file = uploadsDir(kind, name);
    if (!fs.existsSync(file)) return notFound();
    return new Response(stream(file), {
      headers: {
        "Content-Type": TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream",
        "Content-Length": String(fs.statSync(file).size),
        // Uploaded files get a new random name, so they can be cached forever.
        "Cache-Control": name.startsWith("seed-")
          ? "public, max-age=86400"
          : "public, max-age=31536000, immutable",
      },
    });
  }

  if (kind === "library" && parts.length >= 2) {
    const id = Number(a);
    if (!Number.isInteger(id)) return notFound();
    const row = db()
      .prepare(
        `SELECT l.file, l.original_name FROM library_files l JOIN products p ON p.id = l.product_id
         WHERE l.id = ? AND p.published = 1`,
      )
      .get(id) as { file: string; original_name: string } | undefined;
    const name = row && safeName(row.file);
    if (!row || !name) return notFound();
    const file = uploadsDir("library", name);
    if (!fs.existsSync(file)) return notFound();
    const ascii = row.original_name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    return new Response(stream(file), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(fs.statSync(file).size),
        "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(row.original_name)}`,
        "Cache-Control": "no-cache",
      },
    });
  }

  return notFound();
}
