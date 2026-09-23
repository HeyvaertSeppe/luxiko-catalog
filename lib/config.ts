import path from "node:path";

/**
 * All settings come from environment variables (see .env.example).
 * Read lazily so a missing optional value never breaks the build.
 */
function env(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v.trim();
}

export const config = {
  get siteUrl() {
    return env("SITE_URL", "http://localhost:3000").replace(/\/+$/, "");
  },
  get authSecret() {
    return env("AUTH_SECRET");
  },
  get googleClientId() {
    return env("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return env("GOOGLE_CLIENT_SECRET");
  },
  get adminEmails(): string[] {
    return env("ADMIN_EMAILS")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
  get resendApiKey() {
    return env("RESEND_API_KEY");
  },
  get mailFrom() {
    return env("MAIL_FROM", "LUXIKO <onboarding@resend.dev>");
  },
  get quoteTo(): string[] {
    return env("QUOTE_TO_EMAIL")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  },
  get company() {
    return {
      name: env("COMPANY_NAME", "LUXIKO"),
      tagline: "Betaalbaar licht & geluid",
      email: env("COMPANY_EMAIL"),
      phone: env("COMPANY_PHONE"),
      address: env("COMPANY_ADDRESS"),
      vat: env("COMPANY_VAT"),
    };
  },
  get dataDir() {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), env("DATA_DIR", "./data"));
  },
};

/** Human readable list of settings that still need a value. */
export function missingSettings(): string[] {
  const missing: string[] = [];
  if (!process.env.SITE_URL) missing.push("SITE_URL");
  if (config.authSecret.length < 32) missing.push("AUTH_SECRET (min. 32 characters)");
  if (!config.googleClientId) missing.push("GOOGLE_CLIENT_ID");
  if (!config.googleClientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  if (config.adminEmails.length === 0) missing.push("ADMIN_EMAILS");
  if (!config.resendApiKey) missing.push("RESEND_API_KEY");
  if (config.quoteTo.length === 0) missing.push("QUOTE_TO_EMAIL");
  return missing;
}
