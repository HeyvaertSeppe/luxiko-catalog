import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth";
import { config } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Sends a test e-mail to the quote address with the saved Resend settings. */
export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (auth instanceof Response) return auth;
  if (!rateLimit(`testmail:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many test e-mails, wait a few minutes." }, { status: 429 });
  }
  if (!config.resendApiKey) return Response.json({ error: "Save a Resend API key first." }, { status: 400 });
  if (!config.quoteTo.length) return Response.json({ error: "Save a quote e-mail address first." }, { status: 400 });
  try {
    const result = await new Resend(config.resendApiKey).emails.send({
      from: config.mailFrom,
      to: config.quoteTo,
      subject: "LUXIKO catalog — test e-mail",
      text: `E-mail from the LUXIKO catalog works.\n\nQuote requests from ${config.siteUrl} will arrive at this address.`,
    });
    if (result.error) return Response.json({ error: `Resend: ${result.error.message}` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: `Could not reach Resend: ${err instanceof Error ? err.message : err}` }, { status: 502 });
  }
  return Response.json({ ok: true, to: config.quoteTo.join(", ") });
}
