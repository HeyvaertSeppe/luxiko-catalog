import type { Metadata, Viewport } from "next";
import "@fontsource/open-sauce-one/400.css";
import "@fontsource/open-sauce-one/700.css";
import "@fontsource/league-spartan/700.css";
import "./globals.css";
import { config } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(config.siteUrl),
    title: { default: "LUXIKO · Product Catalog 2027", template: "%s · LUXIKO" },
    description: "LUXIKO stage lighting catalog 2027: moving heads, PARs, bars, strobes, lasers and more. Betaalbaar licht & geluid.",
    icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
    openGraph: { siteName: "LUXIKO", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
