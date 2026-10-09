import Link from "next/link";

const styles = {
  solid: "bg-espresso text-white hover:bg-taupe",
  outline: "border border-espresso text-espresso hover:bg-espresso hover:text-white",
  /** Für dunkle Flächen und Fotos */
  light: "bg-white text-espresso hover:bg-stone",
  outlineLight: "border border-white text-white hover:bg-white hover:text-espresso",
} as const;

/** Eckiger Knopf wie im Styleguide: Großbuchstaben, 48 px hoch. */
export function ButtonLink({
  href,
  children,
  variant = "solid",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof styles;
  external?: boolean;
}) {
  const className = `label inline-flex min-h-12 items-center justify-center px-7 transition-colors ${styles[variant]}`;
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
