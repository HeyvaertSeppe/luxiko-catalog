import { CONSOLES } from "@/lib/consoles";
import { config } from "@/lib/config";
import { consoleLogos } from "@/lib/settings";
import { getSetting, settingSource } from "@/lib/runtime-config";
import { SETTINGS_GROUPS } from "@/lib/settings-schema";
import { getAdminAccount } from "@/lib/admin-account";
import { getSession } from "@/lib/auth";
import { ConsoleLogoForm } from "@/components/admin/ConsoleLogoForm";
import { SettingsForm, type FieldState } from "@/components/admin/SettingsForm";
import { AccountForm } from "@/components/admin/AccountForm";
import { DownloadIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const logos = consoleLogos();
  const account = getAdminAccount();
  const session = await getSession();

  // Secret values never leave the server: the form only learns whether they are set.
  const groups = SETTINGS_GROUPS.map((g) => ({
    ...g,
    fields: g.fields.map<FieldState>((f) => {
      const source = settingSource(f.key);
      const value = getSetting(f.key);
      return {
        ...f,
        value: f.secret ? "" : source === "default" ? "" : value,
        defaultValue: source === "default" ? value : "",
        isSet: Boolean(value) && source !== "default",
        source,
      };
    }),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-grey">
          Everything is saved on the server in <code className="text-ink">config.env</code> inside the data volume. Secrets are never shown again after saving.
        </p>
      </div>

      <section className="panel">
        <div className="bar">Admin account</div>
        <div className="p-6">
          {account?.initial && (
            <p className="mb-5 border-l-4 border-orange bg-zebra px-3 py-2 text-sm text-navy">
              You are still using the generated first-start password. Choose your own password below.
            </p>
          )}
          <AccountForm username={account?.username ?? "admin"} viaGoogle={session?.method === "google"} />
        </div>
      </section>

      <SettingsForm groups={groups} redirectUri={`${config.siteUrl}/api/auth/callback`} />

      <section className="panel">
        <div className="bar">Catalog PDF</div>
        <div className="p-6">
          <p className="max-w-2xl text-sm text-grey">
            Generates the printable catalog from the current products, with a QR code for every product that opens its page on{" "}
            <strong className="text-ink">{config.siteUrl}</strong>. Hidden products are left out. Regenerate after adding products,
            changing photos or changing the website address.
          </p>
          <a href="/api/admin/catalog-pdf" className="btn-primary mt-4">
            <DownloadIcon /> Download catalog PDF
          </a>
        </div>
      </section>

      <section className="panel">
        <div className="bar">Console logos</div>
        <div className="p-6">
          <p className="max-w-2xl text-sm text-grey">
            Shown on the library download buttons. Upload the official logos (PNG or SVG with a transparent or white background) to replace the built-in badges.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONSOLES.map((c) => (
              <ConsoleLogoForm key={c.id} id={c.id} name={c.name} url={logos[c.id].url} custom={logos[c.id].custom} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
