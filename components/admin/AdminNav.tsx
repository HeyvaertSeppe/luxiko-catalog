"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ newQuotes }: { newQuotes: number }) {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Products", active: path === "/admin" || path.startsWith("/admin/products") },
    { href: "/admin/quotes", label: "Quotes", active: path.startsWith("/admin/quotes"), badge: newQuotes },
    { href: "/admin/settings", label: "Settings", active: path.startsWith("/admin/settings") },
  ];
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`caps relative shrink-0 px-1 py-1.5 text-[11px] transition ${i.active ? "border-b-2 border-orange text-navy" : "border-b-2 border-transparent text-grey hover:text-navy"}`}
        >
          {i.label}
          {i.badge ? (
            <span className="ml-1.5 bg-orange px-1.5 py-0.5 text-[10px] font-bold text-navy">{i.badge}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
