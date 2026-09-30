import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Settings store: <DATA_DIR>/config.env
 *
 * The admin Settings page writes here, so nothing has to be configured
 * before `docker compose up`. The file lives in the data volume, is written
 * with mode 600 and is never served over HTTP. Secret values are never sent
 * to the browser.
 *
 * Lookup order for every setting: config.env → environment variable → default.
 */

export function dataDir() {
  const v = process.env.DATA_DIR;
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), v && v.trim() ? v.trim() : "./data");
}

export function configFile() {
  return path.join(dataDir(), "config.env");
}

export const SETTING_KEYS = [
  "SITE_URL",
  "AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ADMIN_EMAILS",
  "RESEND_API_KEY",
  "MAIL_FROM",
  "QUOTE_TO_EMAIL",
  "COMPANY_NAME",
  "COMPANY_EMAIL",
  "COMPANY_PHONE",
  "COMPANY_ADDRESS",
  "COMPANY_VAT",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

/** Values that are never shown in the admin (write-only). */
export const SECRET_KEYS: SettingKey[] = ["AUTH_SECRET", "GOOGLE_CLIENT_SECRET", "RESEND_API_KEY"];

export const DEFAULTS: Partial<Record<SettingKey, string>> = {
  SITE_URL: "https://catalog.luxiko.be",
  COMPANY_NAME: "LUXIKO",
};

let cache: { mtimeMs: number; size: number; values: Record<string, string> } | null = null;

function escapeValue(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
}

function unescapeValue(v: string) {
  return v.replace(/\\(n|"|\\)/g, (_, c: string) => (c === "n" ? "\n" : c));
}

function parse(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/.exec(line);
    if (m && (SETTING_KEYS as readonly string[]).includes(m[1])) out[m[1]] = unescapeValue(m[2]);
  }
  return out;
}

/** All values currently saved in config.env. */
export function readStore(): Record<string, string> {
  const file = configFile();
  let stat: fs.Stats;
  try {
    stat = fs.statSync(file);
  } catch {
    cache = null;
    return {};
  }
  if (!cache || cache.mtimeMs !== stat.mtimeMs || cache.size !== stat.size) {
    cache = { mtimeMs: stat.mtimeMs, size: stat.size, values: parse(fs.readFileSync(file, "utf8")) };
  }
  return cache.values;
}

/** Merge updates into config.env (null removes a key). Atomic write, mode 600. */
export function writeStore(updates: Partial<Record<SettingKey, string | null>>) {
  const current = { ...readStore() };
  for (const [k, v] of Object.entries(updates)) {
    if (!(SETTING_KEYS as readonly string[]).includes(k)) continue;
    if (v === null || v === undefined || v === "") delete current[k];
    else current[k] = v;
  }
  const body =
    "# LUXIKO catalog settings — managed from Admin → Settings.\n" +
    "# Contains secrets: keep private, never commit.\n" +
    SETTING_KEYS.filter((k) => current[k] !== undefined)
      .map((k) => `${k}="${escapeValue(current[k])}"`)
      .join("\n") +
    "\n";
  fs.mkdirSync(dataDir(), { recursive: true });
  const tmp = `${configFile()}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, body, { mode: 0o600 });
  fs.renameSync(tmp, configFile());
  fs.chmodSync(configFile(), 0o600);
  cache = null;
}

/** Where a setting's value comes from. */
export function settingSource(key: SettingKey): "admin" | "env" | "default" | "none" {
  if (readStore()[key] !== undefined) return "admin";
  if (process.env[key]?.trim()) return "env";
  if (DEFAULTS[key] !== undefined) return "default";
  return "none";
}

export function getSetting(key: SettingKey): string {
  const stored = readStore()[key];
  if (stored !== undefined) return stored;
  const env = process.env[key];
  if (env !== undefined && env.trim() !== "") return env.trim();
  return DEFAULTS[key] ?? "";
}
