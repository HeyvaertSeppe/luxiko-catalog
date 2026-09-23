import { Resend } from "resend";
import { config } from "./config";

export type QuoteMail = {
  productCode: string;
  productName: string;
  productUrl: string;
  imageUrl?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  quantity: number;
  purpose: string;
  neededBy: string;
  message: string;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const NAVY = "#202A4B";
const ORANGE = "#F2AE1C";

function layout(title: string, body: string) {
  const logo = `${config.siteUrl}/brand/logo-dark.png`;
  return `<!doctype html><html><body style="margin:0;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;color:${NAVY}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="padding:24px 28px;border-bottom:4px solid ${ORANGE}"><img src="${logo}" alt="LUXIKO" height="44" style="display:block;height:44px"></td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:22px;color:${NAVY}">${esc(title)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:16px 28px;background:${NAVY};color:#c9cde0;font-size:12px">${esc(config.company.name)} · ${esc(config.company.tagline)}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function row(label: string, value: string) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b7190;font-size:14px;white-space:nowrap;vertical-align:top">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:bold">${esc(value).replace(/\n/g, "<br>")}</td></tr>`;
}

function productBlock(q: QuoteMail) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f7f8fb;border-radius:10px;margin:0 0 20px">
    <tr>
      ${q.imageUrl ? `<td style="padding:12px;width:110px"><img src="${esc(q.imageUrl)}" width="100" style="display:block;border-radius:8px;background:#fff"></td>` : ""}
      <td style="padding:12px">
        <div style="font-size:18px;font-weight:bold">${esc(q.productCode)}</div>
        <div style="color:${ORANGE};font-weight:bold;font-size:14px">${esc(q.productName)}</div>
        <a href="${esc(q.productUrl)}" style="color:${NAVY};font-size:13px">View product page →</a>
      </td>
    </tr></table>`;
}

export function mailConfigured() {
  return Boolean(config.resendApiKey && config.quoteTo.length);
}

/** Sends the quote to the LUXIKO team, and a confirmation to the customer. */
export async function sendQuoteMails(q: QuoteMail): Promise<boolean> {
  if (!mailConfigured()) {
    console.warn("[luxiko] RESEND_API_KEY / QUOTE_TO_EMAIL not set — quote saved but no e-mail sent.");
    return false;
  }
  const resend = new Resend(config.resendApiKey);

  const details = `<table role="presentation" cellpadding="0" cellspacing="0">
    ${row("Name", q.name)}${row("Company", q.company)}${row("E-mail", q.email)}${row("Phone", q.phone)}
    ${row("Country", q.country)}${row("Quantity", String(q.quantity))}${row("Purpose", q.purpose)}
    ${row("Needed by", q.neededBy)}${row("Message", q.message)}</table>`;

  const internal = await resend.emails.send({
    from: config.mailFrom,
    to: config.quoteTo,
    replyTo: q.email,
    subject: `Quote request: ${q.quantity}× ${q.productCode} — ${q.company || q.name}`,
    html: layout("New quote request", productBlock(q) + details),
  });
  if (internal.error) {
    console.error("[luxiko] Resend error:", internal.error);
    return false;
  }

  const contact = [config.company.email, config.company.phone].filter(Boolean).join(" · ");
  const confirm = await resend.emails.send({
    from: config.mailFrom,
    to: q.email,
    replyTo: config.company.email || config.quoteTo[0],
    subject: `We received your quote request for ${q.productCode}`,
    html: layout(
      `Thanks, ${q.name.split(" ")[0]}!`,
      `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">We received your request and will get back to you with a quote as soon as possible, usually within one business day.</p>
       ${productBlock(q)}${details}
       ${contact ? `<p style="font-size:13px;color:#6b7190;margin:20px 0 0">Questions? ${esc(contact)}</p>` : ""}`,
    ),
  });
  if (confirm.error) console.error("[luxiko] Resend confirmation error:", confirm.error);
  return true;
}
