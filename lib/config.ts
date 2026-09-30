import { dataDir, getSetting } from "./runtime-config";

function list(v: string) {
  return v
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * App settings. Values come from Admin → Settings (stored in
 * <DATA_DIR>/config.env), then environment variables, then defaults.
 * Read on every access, so changes in the admin apply without a restart.
 */
export const config = {
  get siteUrl() {
    return getSetting("SITE_URL").replace(/\/+$/, "");
  },
  get authSecret() {
    return getSetting("AUTH_SECRET");
  },
  get googleClientId() {
    return getSetting("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return getSetting("GOOGLE_CLIENT_SECRET");
  },
  get googleEnabled() {
    return Boolean(this.googleClientId && this.googleClientSecret);
  },
  get adminEmails(): string[] {
    return list(getSetting("ADMIN_EMAILS")).map((e) => e.toLowerCase());
  },
  get resendApiKey() {
    return getSetting("RESEND_API_KEY");
  },
  get mailFrom() {
    return getSetting("MAIL_FROM") || "LUXIKO <onboarding@resend.dev>";
  },
  get quoteTo(): string[] {
    return list(getSetting("QUOTE_TO_EMAIL"));
  },
  get company() {
    return {
      name: getSetting("COMPANY_NAME") || "LUXIKO",
      tagline: "Betaalbaar licht & geluid",
      email: getSetting("COMPANY_EMAIL"),
      phone: getSetting("COMPANY_PHONE"),
      address: getSetting("COMPANY_ADDRESS"),
      vat: getSetting("COMPANY_VAT"),
    };
  },
  get dataDir() {
    return dataDir();
  },
};

/** Human readable list of settings that still need a value. */
export function missingSettings(): string[] {
  const missing: string[] = [];
  if (!config.resendApiKey) missing.push("Resend API key");
  if (config.quoteTo.length === 0) missing.push("quote e-mail address");
  return missing;
}
