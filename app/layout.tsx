import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { brand } from "@/lib/brand.config";
import "./globals.css";

// Schrift liegt lokal im Projekt (app/fonts), es werden keine Daten an Google gesendet.
// Montserrat steht unter der SIL Open Font License.
const sans = localFont({
  variable: "--font-montserrat",
  display: "swap",
  src: [
    { path: "./fonts/montserrat-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/montserrat-latin-wght-italic.woff2", weight: "100 900", style: "italic" },
  ],
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
  themeColor: brand.colors.paper,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={brand.language} className={sans.variable}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
