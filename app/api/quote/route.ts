import { z } from "zod";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { getProductByCode } from "@/lib/products";
import { sendQuoteMails } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  company: z.string().trim().max(160).default(""),
  email: z.string().trim().email("Please enter a valid e-mail address").max(200),
  phone: z.string().trim().max(40).default(""),
  country: z.string().trim().max(80).default(""),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(100000),
  purpose: z.enum(["Purchase", "Rental", "Installation project", "Other"]).default("Purchase"),
  neededBy: z.string().trim().max(40).default(""),
  message: z.string().trim().max(3000).default(""),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form" }, { status: 400 });
  }
  const q = parsed.data;
  const product = getProductByCode(q.code);
  if (!product) return Response.json({ error: "Unknown product" }, { status: 404 });

  const res = db()
    .prepare(
      `INSERT INTO quotes (product_id, product_code, name, company, email, phone, country, quantity, purpose, needed_by, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(product.id, product.code, q.name, q.company, q.email, q.phone, q.country, q.quantity, q.purpose, q.neededBy, q.message);

  let sent = false;
  try {
    sent = await sendQuoteMails({
      ...q,
      productCode: product.code,
      productName: product.name,
      productUrl: `${config.siteUrl}/p/${encodeURIComponent(product.code)}`,
      imageUrl: product.images[0] ? `${config.siteUrl}${product.images[0].url}` : undefined,
    });
  } catch (err) {
    console.error("[luxiko] Failed to send quote e-mail", err);
  }
  if (sent) db().prepare("UPDATE quotes SET email_sent = 1 WHERE id = ?").run(res.lastInsertRowid);

  return Response.json({ ok: true, emailed: sent });
}
