import Link from "next/link";

const styles = {
  primary: "bg-cocoa text-cream hover:bg-ink",
  secondary: "border border-cocoa text-cocoa hover:bg-sand/60",
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
  const className = `inline-flex min-h-11 items-center justify-center rounded-full px-7 py-3 text-sm tracking-wide transition-colors ${styles[variant]}`;
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
