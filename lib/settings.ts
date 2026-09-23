import { db } from "./db";
import { CONSOLES, type ConsoleId } from "./consoles";

export function getSetting(key: string): string | null {
  const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null) {
  if (value === null) db().prepare("DELETE FROM settings WHERE key = ?").run(key);
  else
    db()
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(key, value);
}

/** URL of the logo shown on a console download button (uploaded logo, or the built-in one). */
export function consoleLogoUrl(id: ConsoleId): string {
  const custom = getSetting(`consoleLogo:${id}`);
  return custom ? `/files/consoles/${encodeURIComponent(custom)}` : `/consoles/${id}.svg`;
}

export function consoleLogos(): Record<ConsoleId, { url: string; custom: boolean }> {
  return Object.fromEntries(
    CONSOLES.map((c) => [c.id, { url: consoleLogoUrl(c.id), custom: Boolean(getSetting(`consoleLogo:${c.id}`)) }]),
  ) as Record<ConsoleId, { url: string; custom: boolean }>;
}
