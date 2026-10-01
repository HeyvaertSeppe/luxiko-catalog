import { z } from "zod";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { getProductByCode } from "@/lib/products";
import { sendQuoteMails } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { quotePurposes } from "@/lib/quote-options";
import { DEFAULT_LOCALE, LOCALES, getDict, href, isLocale, type Dict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const schema = (t: Dict["quote"]) => z.object({
  code: z.string().trim().min(1).max(40),
  lang: z.enum(LOCALES).catch(DEFAULT_LOCALE),
  name: z.string().trim().min(2, t.nameRequired).max(120),
  company: z.string().trim().max(160).default(""),
  email: z.string().trim().email(t.emailInvalid).max(200),
  phone: z.string().trim().max(40).default(""),
  country: z.string().trim().max(80).default(""),
  quantity: z.coerce.number().int().min(1, t.quantityInvalid).max(100000),
  purpose: z.string().trim().max(60).default(""),
  neededBy: z.string().trim().max(40).default(""),
  message: z.string().trim().max(3000).default(""),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  // Answer in the visitor's language.
  const requested = (body as { lang?: unknown } | null)?.lang;
  const t = getDict(isLocale(requested) ? requested : DEFAULT_LOCALE).quote;

  if (!rateLimit(`quote:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return Response.json({ error: t.tooMany }, { status: 429 });
  }
  const parsed = schema(t).safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? t.checkForm }, { status: 400 });
  }
  const q = parsed.data;
  const purposes = quotePurposes();
  if (q.purpose && !purposes.includes(q.purpose)) {
    return Response.json({ error: t.chooseOption }, { status: 400 });
  }
  const product = getProductByCode(q.code);
  if (!product) return Response.json({ error: t.unknownProduct }, { status: 404 });

  const res = db()
    .prepare(
      `INSERT INTO quotes (product_id, product_code, name, company, email, phone, country, quantity, purpose, needed_by, message, lang)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(product.id, product.code, q.name, q.company, q.email, q.phone, q.country, q.quantity, q.purpose, q.neededBy, q.message, q.lang);

  let sent = false;
  try {
    sent = await sendQuoteMails({
      ...q,
      productCode: product.code,
      productName: product.name,
      productUrl: `${config.siteUrl}${href(q.lang, `/p/${encodeURIComponent(product.code)}`)}`,
      imageUrl: product.images[0] ? `${config.siteUrl}${product.images[0].url}` : undefined,
    });
  } catch (err) {
    console.error("[luxiko] Failed to send quote e-mail", err);
  }
  if (sent) db().prepare("UPDATE quotes SET email_sent = 1 WHERE id = ?").run(res.lastInsertRowid);

  return Response.json({ ok: true, emailed: sent });
}
