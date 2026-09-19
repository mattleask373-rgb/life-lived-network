/**
 * A person, shown as themselves or not at all.
 *
 * If there is a real photograph the person uploaded, it is shown. If there
 * isn't, initials on plain paper — never a stock face, never a generated one.
 */

export function PersonAvatar({
  name,
  photoUrl,
  size = 44,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-sm text-secondary-foreground"
      style={{ width: size, height: size }}
      aria-hidden={false}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span aria-label={name}>{initials || "·"}</span>
      )}
    </span>
  );
}
