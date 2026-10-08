/** Platzhalter für Admin-Seiten, die in Phase 5 gebaut werden. */
export function AdminPlaceholder({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">{title}</h1>
      <p className="mt-4 max-w-xl text-cocoa">{text}</p>
      <p className="mt-8 text-xs uppercase tracking-[0.25em] text-cocoa">
        Phase 5, Login folgt
      </p>
    </div>
  );
}
