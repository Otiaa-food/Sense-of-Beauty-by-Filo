export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

/** Hauptmenü (Aufbau nach Lumo: Bereiche mit Untermenüs) */
export const mainNav: NavItem[] = [
  {
    label: "Über Filo",
    href: "/about",
    children: [
      { label: "Über Filo", href: "/about" },
      { label: "Stimmen", href: "/reviews" },
    ],
  },
  { label: "Behandlungen & Preise", href: "/treatments" },
  { label: "Studio", href: "/studio" },
  {
    label: "Termine",
    href: "/book",
    children: [
      { label: "Termin buchen", href: "/book" },
      { label: "Pflegehinweise", href: "/pflegehinweise" },
      { label: "Stornierung", href: "/stornierung" },
    ],
  },
  { label: "Kontakt", href: "/contact" },
];
