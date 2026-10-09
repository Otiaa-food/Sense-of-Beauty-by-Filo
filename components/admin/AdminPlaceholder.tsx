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
      <h1 className="text-3xl font-light text-espresso">{title}</h1>
      <p className="mt-4 max-w-xl text-muted">{text}</p>
      <p className="mt-8 label text-muted">
        Phase 5, Login folgt
      </p>
    </div>
  );
}
