import { config } from "@/lib/config";

export function SiteFooter() {
  const c = config.company;
  return (
    <footer className="mt-24 border-t border-white/5 bg-navy-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-light.png" alt="LUXIKO" className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-navy-300">
            Professional stage lighting at honest prices. Prices on request — every product page has a quote button.
          </p>
        </div>
        <div className="text-sm text-navy-300">
          {(c.email || c.phone || c.address) && <div className="eyebrow mb-3">Contact</div>}
          <ul className="space-y-1.5">
            {c.email && (
              <li>
                <a className="hover:text-white" href={`mailto:${c.email}`}>{c.email}</a>
              </li>
            )}
            {c.phone && (
              <li>
                <a className="hover:text-white" href={`tel:${c.phone.replace(/\s+/g, "")}`}>{c.phone}</a>
              </li>
            )}
            {c.address && <li className="whitespace-pre-line">{c.address}</li>}
            {c.vat && <li>VAT {c.vat}</li>}
          </ul>
        </div>
        <div className="text-sm text-navy-300 md:text-right">
          <div className="eyebrow mb-3">Catalog 2027</div>
          <p>Specifications may change without notice.</p>
          <p className="mt-4 text-xs text-navy-500">© {new Date().getFullYear()} {c.name}</p>
        </div>
      </div>
    </footer>
  );
}
