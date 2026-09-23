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
          className={`relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${i.active ? "bg-white/10 text-white" : "text-navy-300 hover:text-white"}`}
        >
          {i.label}
          {i.badge ? (
            <span className="ml-1.5 rounded-full bg-amber-brand px-1.5 py-0.5 text-[10px] font-bold text-navy-950">{i.badge}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
