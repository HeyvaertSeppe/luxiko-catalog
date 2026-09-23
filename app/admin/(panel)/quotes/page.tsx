import { db } from "@/lib/db";
import { mailConfigured } from "@/lib/mail";
import { QuoteList, type QuoteRow } from "@/components/admin/QuoteList";

export const dynamic = "force-dynamic";

export default function QuotesPage() {
  const rows = db()
    .prepare(
      `SELECT q.id, q.product_code AS productCode, p.id AS productId, q.name, q.company, q.email, q.phone, q.country,
              q.quantity, q.purpose, q.needed_by AS neededBy, q.message, q.status, q.email_sent AS emailSent, q.created_at AS createdAt
       FROM quotes q LEFT JOIN products p ON p.id = q.product_id ORDER BY q.id DESC LIMIT 500`,
    )
    .all() as QuoteRow[];

  return (
    <div>
      <h1 className="text-4xl tracking-tight text-ink">Quote requests</h1>
      <p className="mt-1 text-sm text-grey">
        Every request is saved here{mailConfigured() ? "and e-mailed to you via Resend" : ""}. Reply straight from your mail client — the reply-to is the customer.
      </p>
      {!mailConfigured() && (
        <div className="mt-4 border border-orange bg-zebra p-4 text-sm text-navy">
          E-mail is not configured yet: set <code>RESEND_API_KEY</code>, <code>MAIL_FROM</code> and <code>QUOTE_TO_EMAIL</code> in <code>.env.local</code>. Requests are still saved on this page.
        </div>
      )}
      <QuoteList rows={rows} />
    </div>
  );
}
