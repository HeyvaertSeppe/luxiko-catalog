import { z } from "zod";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { sendContactMails } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { DEFAULT_LOCALE, LOCALES, getDict, isLocale, type Dict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/**
 * Contact form of the main website (luxiko.be), which is a plain static site.
 * Only that site (Settings → Main website address, with or without www.) and
 * the catalog itself may post here.
 */
function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  let host: string;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    host = u.hostname.toLowerCase();
  } catch {
    return null;
  }
  const allowed = new Set<string>();
  for (const url of [config.mainSiteUrl, config.siteUrl]) {
    try {
      const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
      allowed.add(h).add(`www.${h}`);
    } catch {}
  }
  return allowed.has(host) ? origin : null;
}

function cors(origin: string | null): Record<string, string> {
  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

const schema = (t: Dict["quote"]) =>
  z.object({
    lang: z.enum(LOCALES).catch(DEFAULT_LOCALE),
    name: z.string().trim().min(2, t.nameRequired).max(120),
    company: z.string().trim().max(160).default(""),
    email: z.string().trim().email(t.emailInvalid).max(200),
    phone: z.string().trim().max(40).default(""),
    message: z.string().trim().min(5, t.messageRequired).max(3000),
    page: z.string().trim().max(200).catch(""),
    website: z.string().max(0).optional(), // honeypot: real people leave this empty
  });

export function OPTIONS(req: Request) {
  const origin = allowedOrigin(req);
  return new Response(null, { status: origin ? 204 : 403, headers: cors(origin) });
}

export async function POST(req: Request) {
  const origin = allowedOrigin(req);
  if (!origin) return Response.json({ error: "Cross-site request blocked" }, { status: 403, headers: cors(null) });
  const headers = cors(origin);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400, headers });
  }
  const requested = (body as { lang?: unknown } | null)?.lang;
  const t = getDict(isLocale(requested) ? requested : DEFAULT_LOCALE).quote;

  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return Response.json({ error: t.tooMany }, { status: 429, headers });
  }
  const parsed = schema(t).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? t.checkForm }, { status: 400, headers });
  }
  const m = parsed.data;

  // Saved with the quote requests (no product), so nothing gets lost when e-mail is not set up.
  const res = db()
    .prepare(
      `INSERT INTO quotes (product_id, product_code, name, company, email, phone, quantity, purpose, message, lang)
       VALUES (NULL, '', ?, ?, ?, ?, 1, 'Website contact form', ?, ?)`,
    )
    .run(m.name, m.company, m.email, m.phone, m.message, m.lang);

  let sent = false;
  try {
    sent = await sendContactMails({ ...m, page: m.page });
  } catch (err) {
    console.error("[luxiko] Failed to send contact e-mail", err);
  }
  if (sent) db().prepare("UPDATE quotes SET email_sent = 1 WHERE id = ?").run(res.lastInsertRowid);

  return Response.json({ ok: true, emailed: sent }, { headers });
}
