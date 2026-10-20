import { cn } from "@/lib/utils";

/** The Atlas brand mark: a quiet compass. Decorative; label the parent link. */
export function CompassMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={cn("h-9 w-9", className)} aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
      <path d="M18 6.2 L21.2 18 L18 16.2 L14.8 18 Z" fill="var(--color-primary)" />
      <path d="M18 29.8 L14.8 18 L18 19.8 L21.2 18 Z" fill="var(--color-ink)" />
      <circle cx="18" cy="18" r="1.5" fill="var(--color-primary)" />
    </svg>
  );
}
