# Portable UI patterns from the Grok prototype

These snippets are reproduced from the uploaded design prototype for reference only. The surrounding prototype depended on a local mock store and fake inventory, which are deliberately not included here.

## Compass mark

The current app already contains the same quiet compass in `src/components/compass-mark.tsx`. No duplicate logo component is needed.

```tsx
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
```

## Photo-led listing pattern

Original prototype used a real image field from its mock `Listing` object. In the canonical product, use only `WorldEntry.photos` where source URL, credit and alt text came from the current data contract. If no photo exists, keep the neutral placeholder; never borrow `src/data/atlas.ts` photos or invent an image.

```tsx
<div className="overflow-hidden rounded-3xl bg-sand">
  <img
    src={listing.image}
    alt={listing.title}
    loading="lazy"
    className="card-media aspect-[4/3] w-full object-cover"
  />
</div>
<div className="px-1 pt-3">
  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
    {listing.category} · {listing.neighborhood}
  </p>
  <h3 className="mt-1 font-display text-xl leading-snug text-ink">
    {listing.title}
  </h3>
</div>
```

## Mobile navigation pattern

The prototype used a fixed phone tab bar with the safe-area inset and 44px+ controls. The main product already has a mobile tab bar in `src/routes/__root.tsx`; retain its canonical destinations (`Explore`, `Find`, `Journey`, `You`) rather than importing mock routes such as `/map`, `/moments`, or `/you`.

```tsx
<nav
  aria-label="Main tabs"
  className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
>
  {/* Existing canonical links only; every target must remain at least 44px high. */}
</nav>
```

## Visual design contract

- Canvas `#f3f0e8`, card surface `#fffcf7`, ink `#1b1916`, muted text `#6e675e`, line `#e4ded3`, forest `#0c6b56`, sage `#e3f2eb`, sand `#efe6d6`.
- Fraunces for display/headings; Manrope for body/UI.
- Large soft corners, real source-backed photos when present, restrained motion, visible focus, and unforced empty states.
- Cards should expose event dates, service/provider distinctions, source provenance, trust/demonstration state and money using the canonical model. The prototype's sample amounts, names, cities and event content are not portable.
