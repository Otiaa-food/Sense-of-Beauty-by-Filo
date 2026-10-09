import type { Metadata } from "next";

// Der Admin-Bereich soll nie in Suchmaschinen auftauchen.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
