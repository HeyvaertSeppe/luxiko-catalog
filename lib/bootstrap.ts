import crypto from "node:crypto";
import fs from "node:fs";
import { SEED_IMAGES_VERSION, db, seedImageFor, seedImageName, uploadsDir } from "./db";
import { getSetting as getDbSetting, setSetting as setDbSetting } from "./settings";
import { ensureAdminAccount, INITIAL_PASSWORD_FILE } from "./admin-account";
import { dataDir, getSetting, writeStore } from "./runtime-config";
import { config } from "./config";

/**
 * Installs that started with older catalog photos get the AI-upscaled ones.
 * Only photos that came from the original PDF ("seed-…") are replaced —
 * photos uploaded in the admin are never touched.
 */
export async function upgradeSeedImages() {
  const current = Number(getDbSetting("seed:imagesVersion") ?? "1");
  if (current >= SEED_IMAGES_VERSION) return;
  const rows = db()
    .prepare(
      `SELECT pi.id, pi.file, p.code FROM product_images pi JOIN products p ON p.id = pi.product_id
       WHERE pi.file LIKE 'seed-%'`,
    )
    .all() as { id: number; file: string; code: string }[];
  const update = db().prepare("UPDATE product_images SET file = ?, width = NULL, height = NULL WHERE id = ?");
  let n = 0;
  let allHq = true;
  for (const row of rows) {
    const src = seedImageFor(row.code);
    if (!src) continue;
    if (!src.endsWith(".webp")) {
      allHq = false; // high-quality photo not shipped (yet): keep the current one
      continue;
    }
    const name = seedImageName(row.code);
    if (name === row.file) continue;
    fs.copyFileSync(src, uploadsDir("images", name));
    update.run(name, row.id);
    fs.rmSync(uploadsDir("images", row.file), { force: true });
    n++;
  }
  if (allHq) setDbSetting("seed:imagesVersion", String(SEED_IMAGES_VERSION));
  if (n) console.log(`[luxiko] Replaced ${n} catalog photos with the high-quality versions`);
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
