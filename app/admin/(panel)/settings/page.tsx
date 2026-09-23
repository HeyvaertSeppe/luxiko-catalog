import { CONSOLES } from "@/lib/consoles";
import { config, missingSettings } from "@/lib/config";
import { consoleLogos } from "@/lib/settings";
import { ConsoleLogoForm } from "@/components/admin/ConsoleLogoForm";
import { DownloadIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const logos = consoleLogos();
  const missing = missingSettings();
  const checks = [
    { label: "Website address (SITE_URL)", ok: Boolean(process.env.SITE_URL), value: config.siteUrl },
    { label: "Session secret (AUTH_SECRET)", ok: config.authSecret.length >= 32 },
    { label: "Google sign-in (GOOGLE_CLIENT_ID / SECRET)", ok: Boolean(config.googleClientId && config.googleClientSecret) },
    { label: "Admin accounts (ADMIN_EMAILS)", ok: config.adminEmails.length > 0, value: config.adminEmails.join(", ") },
    { label: "Resend API key (RESEND_API_KEY)", ok: Boolean(config.resendApiKey) },
    { label: "Sender (MAIL_FROM)", ok: Boolean(process.env.MAIL_FROM), value: config.mailFrom },
    { label: "Quote recipients (QUOTE_TO_EMAIL)", ok: config.quoteTo.length > 0, value: config.quoteTo.join(", ") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-navy-300">Catalog PDF, console logos and configuration status.</p>
      </div>

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-white">Catalog PDF</h2>
        <p className="mt-1 max-w-2xl text-sm text-navy-300">
          Generates the printable catalog from the current products, with a QR code for every product that opens its page on{" "}
          <strong className="text-white">{config.siteUrl}</strong>. Hidden products are left out. Regenerate after adding products or changing photos.
        </p>
        <a href="/api/admin/catalog-pdf" className="btn-primary mt-4">
          <DownloadIcon /> Download catalog PDF
        </a>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-white">Console logos</h2>
        <p className="mt-1 max-w-2xl text-sm text-navy-300">
          Shown on the library download buttons. Upload the official logos (PNG or SVG with a transparent or white background) to replace the built-in badges.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONSOLES.map((c) => (
            <ConsoleLogoForm key={c.id} id={c.id} name={c.name} url={logos[c.id].url} custom={logos[c.id].custom} />
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-white">Configuration</h2>
        <p className="mt-1 max-w-2xl text-sm text-navy-300">
          API keys and secrets live in the <code className="text-white">.env.local</code> file on the server (never in the database or on GitHub). Edit that file and restart the app to change them.
        </p>
        <ul className="mt-4 divide-y divide-white/5">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-3 py-2.5 text-sm">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.ok ? "bg-emerald-400" : "bg-amber-brand"}`} />
              <span className="flex-1 text-white">{c.label}</span>
              <span className="truncate text-right text-xs text-navy-300">{c.ok ? c.value ?? "Set" : "Missing"}</span>
            </li>
          ))}
        </ul>
        {missing.length === 0 && <p className="mt-3 text-sm text-emerald-300">Everything is configured.</p>}
      </section>
    </div>
  );
}
