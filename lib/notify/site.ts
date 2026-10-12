import { brand } from "@/lib/brand.config";

/** Adresse der Website für Links in Nachrichten (eigene Domain, sonst Vercel-Adresse) */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return brand.siteUrl;
}
