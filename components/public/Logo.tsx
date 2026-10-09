import Link from "next/link";
import { brand } from "@/lib/brand.config";

/** Schriftzug als Platzhalter, bis das neue Logo da ist. */
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-white" : "text-espresso";
  return (
    <Link href="/" aria-label={`${brand.fullName}, zur Startseite`} className={`inline-block leading-none ${color}`}>
      <span className="block text-[1.35rem] font-light lowercase tracking-[0.04em]">{brand.name}</span>
      <span className="label mt-1 block !text-[0.6rem] !tracking-[0.42em] opacity-80">{brand.byline}</span>
    </Link>
  );
}
