import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { brand } from "@/lib/brand.config";
import "./globals.css";

// Schriften liegen lokal im Projekt (app/fonts), es werden keine Daten an Google gesendet.
// Beide Schriften stehen unter der SIL Open Font License.
const serif = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "./fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

const sans = localFont({
  variable: "--font-jost",
  display: "swap",
  src: "./fonts/jost-latin-wght-normal.woff2",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: `${brand.fullName} | Korean Skincare in ${brand.address.city}`,
    template: `%s | ${brand.fullName}`,
  },
  description: `Kosmetikstudio in ${brand.address.city}: Korean Facial Care, Wimpern- und Augenbrauenpflege und mehr. Jetzt online Termin buchen.`,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: brand.fullName,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: brand.colors.cream,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={brand.language} className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
