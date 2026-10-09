"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/components/public/nav";

/** Handy-Menü: Vollbild, große dünne Schrift, Untermenüs zum Aufklappen (wie Lumo). */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Beim Seitenwechsel schließen
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Seite dahinter nicht scrollen, Escape schließt
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex h-12 w-12 items-center justify-center text-espresso"
      >
        <span className="sr-only">Menü öffnen</span>
        <svg width="30" height="20" viewBox="0 0 30 20" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M0 3h30M0 10h30M0 17h30" />
        </svg>
      </button>

      {open ? (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menü" className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <div className="flex justify-end px-3 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-12 w-12 items-center justify-center text-muted"
            >
              <span className="sr-only">Menü schließen</span>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M2 2l22 22M24 2L2 24" />
              </svg>
            </button>
          </div>

          <nav aria-label="Hauptmenü" className="px-8 pb-16 pt-4">
            <ul className="space-y-6">
              {mainNav.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <details className="group" open={item.children.some((c) => c.href === pathname)}>
                      <summary className="flex cursor-pointer list-none items-center justify-between text-[2rem] font-light text-espresso [&::-webkit-details-marker]:hidden">
                        {item.label}
                        <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="transition-transform group-open:rotate-180">
                          <path d="M1 1l12 12L25 1" />
                        </svg>
                      </summary>
                      <ul className="mt-4 space-y-4 pl-1">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              aria-current={pathname === c.href ? "page" : undefined}
                              className="block text-xl text-muted aria-[current=page]:font-medium aria-[current=page]:text-espresso"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <Link href={item.href} className="block text-[2rem] font-light text-espresso">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/book" className="label mt-12 flex min-h-12 items-center justify-center bg-espresso px-7 text-white">
              Termin buchen
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
