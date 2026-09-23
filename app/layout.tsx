import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
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
  themeColor: "#070b18",
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
