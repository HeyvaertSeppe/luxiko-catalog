import fs from "node:fs";
import path from "node:path";
import { dataDir } from "./runtime-config";
import { getSetting as getDbSetting, setSetting as setDbSetting } from "./settings";
import { hashPassword, randomPassword, verifyPassword } from "./password";

export const INITIAL_PASSWORD_FILE = () => path.join(dataDir(), "initial-admin-password.txt");

export type AdminAccount = { username: string; version: number; initial: boolean };

export function getAdminAccount(): AdminAccount | null {
  const username = getDbSetting("admin:username");
  if (!username || !getDbSetting("admin:passwordHash")) return null;
  return {
    username,
    version: Number(getDbSetting("admin:version") ?? "1"),
    initial: getDbSetting("admin:initial") === "1",
  };
}

export async function checkAdminLogin(username: string, password: string): Promise<AdminAccount | null> {
  const account = getAdminAccount();
  const hash = getDbSetting("admin:passwordHash");
  // Always run scrypt, so response time does not reveal whether the username exists.
  const ok = await verifyPassword(password, hash ?? "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!account || !hash || !ok) return null;
  if (username.trim().toLowerCase() !== account.username.toLowerCase()) return null;
  return account;
}

export async function setAdminPassword(username: string, password: string, initial = false) {
  const version = Number(getDbSetting("admin:version") ?? "0") + 1;
  setDbSetting("admin:username", username.trim());
  setDbSetting("admin:passwordHash", await hashPassword(password));
  setDbSetting("admin:version", String(version));
  setDbSetting("admin:initial", initial ? "1" : "0");
  if (initial) {
    fs.rmSync(INITIAL_PASSWORD_FILE(), { force: true });
    fs.writeFileSync(
      INITIAL_PASSWORD_FILE(),
      `LUXIKO catalog admin login\n\nURL:      /admin\nUsername: ${username}\nPassword: ${password}\n\nChange it in Admin → Settings → Admin account. This file is deleted automatically.\n`,
      { mode: 0o600 },
    );
  } else {
    fs.rmSync(INITIAL_PASSWORD_FILE(), { force: true });
  }
  return version;
}

/**
 * First start: create the admin account. Uses ADMIN_USERNAME / ADMIN_PASSWORD
 * when set, otherwise "admin" with a random password (printed in the logs
 * and saved in <DATA_DIR>/initial-admin-password.txt).
 */
export async function ensureAdminAccount(): Promise<{ username: string; password?: string; created: boolean }> {
  const existing = getAdminAccount();
  if (existing) {
    let password: string | undefined;
    if (existing.initial) {
      try {
        password = /Password: (.+)/.exec(fs.readFileSync(INITIAL_PASSWORD_FILE(), "utf8"))?.[1];
      } catch {
        // file removed or unreadable: nothing to show
      }
    }
    return { username: existing.username, password, created: false };
  }
  const username = process.env.ADMIN_USERNAME?.trim() || "admin";
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  const password = fromEnv && fromEnv.length >= 10 ? fromEnv : randomPassword();
  await setAdminPassword(username, password, !fromEnv);
  return { username, password: fromEnv ? undefined : password, created: true };
}
