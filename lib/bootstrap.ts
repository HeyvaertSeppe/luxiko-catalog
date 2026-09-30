import crypto from "node:crypto";
import fs from "node:fs";
import sharp from "sharp";
import { db, uploadsDir } from "./db";
import { ensureAdminAccount, INITIAL_PASSWORD_FILE } from "./admin-account";
import { dataDir, getSetting, writeStore } from "./runtime-config";
import { config } from "./config";

/**
 * The photos taken from the original PDF are only 150×110 px. Upscale them
 * once (Lanczos + light sharpening) so they look clean on the website.
 */
export async function upgradeSeedImages() {
  const rows = db()
    .prepare("SELECT id, file FROM product_images WHERE file LIKE 'seed-%.png'")
    .all() as { id: number; file: string }[];
  if (!rows.length) return;
  const update = db().prepare("UPDATE product_images SET file = ?, width = ?, height = ? WHERE id = ?");
  for (const row of rows) {
    const src = uploadsDir("images", row.file);
    if (!fs.existsSync(src)) continue;
    try {
      const meta = await sharp(src).metadata();
      const factor = meta.width && meta.width < 600 ? 3 : 1;
      const out = await sharp(src)
        .flatten({ background: "#ffffff" })
        .resize({ width: (meta.width ?? 150) * factor, kernel: "lanczos3" })
        .sharpen({ sigma: 0.7 })
        .webp({ quality: 90 })
        .toBuffer({ resolveWithObject: true });
      const name = row.file.replace(/\.png$/, ".webp");
      fs.writeFileSync(uploadsDir("images", name), out.data);
      update.run(name, out.info.width, out.info.height, row.id);
      fs.rmSync(src, { force: true });
    } catch (err) {
      console.warn(`[luxiko] Could not upscale ${row.file}:`, err);
    }
  }
  console.log(`[luxiko] Upscaled ${rows.length} catalog photos`);
}

let started: Promise<void> | null = null;

/** Runs once when the server starts (see instrumentation.ts). */
export function bootstrap() {
  started ??= (async () => {
    fs.mkdirSync(dataDir(), { recursive: true });

    // Session signing key: generated once, stored in config.env, never shown.
    if (getSetting("AUTH_SECRET").length < 32) {
      writeStore({ AUTH_SECRET: crypto.randomBytes(48).toString("base64url") });
      console.log("[luxiko] Generated a new session secret");
    }

    db(); // creates / migrates the database and imports the catalog on first start
    await upgradeSeedImages();

    const admin = await ensureAdminAccount();
    const line = "═".repeat(64);
    if (admin.password) {
      console.log(
        `\n${line}\n  LUXIKO admin login   →  ${config.siteUrl}/admin\n\n` +
          `  Username:  ${admin.username}\n  Password:  ${admin.password}\n\n` +
          `  Change it after signing in: Admin → Settings → Admin account.\n` +
          `  (Also saved in ${INITIAL_PASSWORD_FILE()} until you change it.)\n${line}\n`,
      );
    } else if (admin.created) {
      console.log(`[luxiko] Admin account "${admin.username}" created with ADMIN_PASSWORD`);
    }
  })();
  return started;
}
