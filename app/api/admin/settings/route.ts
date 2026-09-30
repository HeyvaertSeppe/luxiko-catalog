import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { writeStore, type SettingKey } from "@/lib/runtime-config";
import { EDITABLE_KEYS } from "@/lib/settings-schema";

// No control characters (newlines only where allowed): keeps config.env well formed.
const line = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Must be a single line");
const email = z.string().trim().email();
const emailList = line(1000).refine(
  (v) => v === "" || v.split(",").every((e) => email.safeParse(e.trim()).success),
  "Use valid e-mail addresses, separated by commas",
);

const rules: Record<string, z.ZodType<string>> = {
  SITE_URL: line(200).refine((v) => {
    if (v === "") return true;
    try {
      const u = new URL(v);
      return (u.protocol === "https:" || u.protocol === "http:") && !u.username && !u.password && !u.search && !u.hash;
    } catch {
      return false;
    }
  }, "Enter a full address like https://catalog.luxiko.be"),
  RESEND_API_KEY: line(200).refine((v) => v === "" || /^\S+$/.test(v), "API keys contain no spaces"),
  MAIL_FROM: line(200).refine(
    (v) => v === "" || email.safeParse(v).success || /^[^<>]{1,100}<[^<>\s]+@[^<>\s]+>$/.test(v),
    'Use an address like "LUXIKO <offerte@luxiko.be>"',
  ),
  QUOTE_TO_EMAIL: emailList,
  GOOGLE_CLIENT_ID: line(200).refine((v) => v === "" || /^\S+$/.test(v), "Client IDs contain no spaces"),
  GOOGLE_CLIENT_SECRET: line(200).refine((v) => v === "" || /^\S+$/.test(v), "Secrets contain no spaces"),
  ADMIN_EMAILS: emailList,
  COMPANY_NAME: line(100),
  COMPANY_EMAIL: line(200).refine((v) => v === "" || email.safeParse(v).success, "Enter a valid e-mail address"),
  COMPANY_PHONE: line(50),
  COMPANY_ADDRESS: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !/[\u0000-\u0009\u000b-\u001f\u007f]/.test(v), "Invalid characters"),
  COMPANY_VAT: line(50),
};

const LABELS: Record<string, string> = {
  SITE_URL: "Website address",
  RESEND_API_KEY: "Resend API key",
  MAIL_FROM: "Sender",
  QUOTE_TO_EMAIL: "Quote e-mail",
  GOOGLE_CLIENT_ID: "Google client ID",
  GOOGLE_CLIENT_SECRET: "Google client secret",
  ADMIN_EMAILS: "Allowed Google accounts",
  COMPANY_NAME: "Company name",
  COMPANY_EMAIL: "Company e-mail",
  COMPANY_PHONE: "Phone",
  COMPANY_ADDRESS: "Address",
  COMPANY_VAT: "VAT number",
};

/**
 * Save settings to <DATA_DIR>/config.env.
 * Body: { values: { KEY: "new value" }, clear: ["KEY"] }
 * Keys that are left out keep their current value (used for secrets).
 */
export async function PUT(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  const body = (await req.json().catch(() => null)) as { values?: Record<string, unknown>; clear?: unknown } | null;
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });

  const updates: Partial<Record<SettingKey, string | null>> = {};
  for (const [key, raw] of Object.entries(body.values ?? {})) {
    if (!EDITABLE_KEYS.includes(key as SettingKey)) return Response.json({ error: `Unknown setting ${key}` }, { status: 400 });
    if (typeof raw !== "string") return Response.json({ error: `${LABELS[key]}: invalid value` }, { status: 400 });
    const r = rules[key].safeParse(raw.replace(/\r\n/g, "\n"));
    if (!r.success) return Response.json({ error: `${LABELS[key]}: ${r.error.issues[0]?.message}` }, { status: 400 });
    let value = r.data;
    if (key === "SITE_URL") value = value.replace(/\/+$/, "");
    updates[key as SettingKey] = value === "" ? null : value;
  }
  if (Array.isArray(body.clear)) {
    for (const key of body.clear) {
      if (typeof key === "string" && EDITABLE_KEYS.includes(key as SettingKey)) updates[key as SettingKey] = null;
    }
  }
  writeStore(updates);
  return Response.json({ ok: true });
}
