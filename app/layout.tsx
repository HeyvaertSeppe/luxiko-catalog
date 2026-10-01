import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource/open-sauce-one/400.css";
import "@fontsource/open-sauce-one/700.css";
import "@fontsource/league-spartan/700.css";
import "./globals.css";
import { config } from "@/lib/config";
import { getDict } from "@/lib/i18n";

async function lang() {
  return (await headers()).get("x-lang") ?? "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await lang());
  return {
    metadataBase: new URL(config.siteUrl),
    title: { default: t.meta.title, template: "%s · LUXIKO" },
    description: t.meta.description,
    icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
    openGraph: { siteName: "LUXIKO", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={await lang()}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
