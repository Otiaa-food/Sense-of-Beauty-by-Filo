import Link from "next/link";

const styles = {
  primary: "rounded-full bg-ink px-8 py-3.5 text-cream hover:bg-cocoa",
  // Ruhiger Zweitknopf: nur Text mit feiner Linie
  secondary: "border-b border-ink/40 pb-1 text-ink hover:border-ink",
  onDark: "rounded-full bg-cream px-8 py-3.5 text-ink hover:bg-sand",
  onDarkQuiet: "border-b border-cream/50 pb-1 text-cream hover:border-cream",
} as const;

/** Einheitlicher Knopf (als Link). Mindesthöhe 44 px, damit er am Handy gut zu treffen ist. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof styles;
  external?: boolean;
}) {
  const className = `inline-flex min-h-11 items-center justify-center text-[0.95rem] tracking-wide transition-colors ${styles[variant]}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
