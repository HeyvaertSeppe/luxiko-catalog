#!/usr/bin/env node
/**
 * Forgot the admin password? Run inside the container:
 *
 *   docker compose exec catalog node scripts/reset-admin-password.mjs
 *
 * Sets a new random password (or the one you pass as first argument),
 * prints it and signs out every admin session.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

// `docker compose exec` runs as root: switch to the app user so every file
// written here stays readable by the app.
if (process.getuid?.() === 0) {
  try {
    process.setgid(1000);
    process.setuid(1000);
  } catch {}
}

const dataDir = path.resolve(process.env.DATA_DIR || "./data");
const dbFile = path.join(dataDir, "luxiko.db");
if (!fs.existsSync(dbFile)) {
  console.error(`No database found at ${dbFile}. Start the app once first.`);
  process.exit(1);
}

const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const given = process.argv[2];
if (given && given.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
const password =
  given ??
  Array.from(crypto.randomBytes(16), (b) => alphabet[b % alphabet.length])
    .join("")
    .replace(/(.{4})(?=.)/g, "$1-");

const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 128 * 32768 * 8 * 2 });
const hash = `scrypt$32768$8$1$${salt.toString("base64")}$${key.toString("base64")}`;

const db = new Database(dbFile);
const get = (k) => db.prepare("SELECT value FROM settings WHERE key = ?").get(k)?.value;
const set = (k, v) =>
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(k, v);

const username = get("admin:username") || "admin";
set("admin:username", username);
set("admin:passwordHash", hash);
set("admin:version", String(Number(get("admin:version") || "0") + 1));
set("admin:initial", given ? "0" : "1");
if (!given) {
  fs.writeFileSync(
    path.join(dataDir, "initial-admin-password.txt"),
    `LUXIKO catalog admin login\n\nURL:      /admin\nUsername: ${username}\nPassword: ${password}\n`,
    { mode: 0o600 },
  );
}
db.close();

console.log(`\nAdmin password reset.\n\n  Username: ${username}\n  Password: ${password}\n\nAll admin sessions have been signed out.\n`);
