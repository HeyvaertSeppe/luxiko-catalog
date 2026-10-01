import { config } from "@/lib/config";
import { getDict, type Locale } from "@/lib/i18n";

export function SiteFooter({ lang }: { lang: Locale }) {
  const t = getDict(lang);
  const c = config.company;
  const contact = [
    c.email && { label: c.email, href: `mailto:${c.email}` },
    c.phone && { label: c.phone, href: `tel:${c.phone.replace(/\s+/g, "")}` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.png" alt="LUXIKO" className="h-10 w-auto" />
          <p className="mt-4 max-w-sm text-sm text-grey">{t.footer.prices}</p>
        </div>
        {(contact.length > 0 || c.address || c.vat) && (
          <div className="text-sm text-navy">
            <div className="caps mb-2 text-[11px] text-grey">{t.footer.contact}</div>
            {contact.map((l) => (
              <a key={l.href} href={l.href} className="block hover:text-orange-dark">{l.label}</a>
            ))}
            {c.address && <p className="whitespace-pre-line">{c.address}</p>}
            {c.vat && <p>{t.footer.vat} {c.vat}</p>}
          </div>
        )}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl justify-between px-4 py-4 text-xs text-grey sm:px-6">
          <span>{c.name.toUpperCase()}  ·  {c.tagline}  ·  {t.footer.catalog}</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
