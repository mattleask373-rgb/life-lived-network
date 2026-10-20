import { ImageOff } from "lucide-react";
import type { KeyboardEvent } from "react";

import { LAYERS, type WorldEntry } from "@/lib/world-data";
import { asBookingState, BOOKING_LABEL, isService, providerLine } from "@/lib/services";
import { cardPhoto, NO_PHOTO_LABEL } from "@/lib/entry-card-view";
import { duration, eventDate, layerText, money } from "./layer-colour";
import { LayerIcon } from "./layer-icon";
import { TrustChip } from "./trust-chip";

const CHIP =
  "inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[0.7rem] text-muted-foreground";

/**
 * A photo-led card. The body contains no interactive descendants, so when
 * clickable it is a single native <button> (Enter/Space for free, no nested
 * controls). Photos come only from the entry's own source-backed records.
 */
export function EntryCard({
  entry,
  onOpen,
  note,
}: {
  entry: WorldEntry;
  onOpen?: (entry: WorldEntry) => void;
  note?: string;
}) {
  const layer = LAYERS.find((l) => l.id === entry.layer);
  const service = isService(entry);
  const photo = cardPhoto(entry);
  const interactive = Boolean(onOpen);

  const handleActivate = () => {
    onOpen?.(entry);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    handleActivate();
  };

  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-muted">
        {photo ? (
          <img
            src={photo.url}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="photo-placeholder flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff aria-hidden size={20} strokeWidth={1.5} />
            <span className="text-xs">{NO_PHOTO_LABEL}</span>
          </div>
        )}
        {photo?.credit ? (
          <span className="absolute bottom-1.5 right-1.5 max-w-[80%] truncate rounded-full bg-card/90 px-2 py-0.5 text-[0.65rem] text-muted-foreground">
            Photo: {photo.credit}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          {layer ? <LayerIcon icon={layer.icon} size={15} strokeWidth={1.7} /> : null}
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${layerText[entry.layer]}`}
          >
            {layer?.label}
          </span>
        </div>
        {/* An event's date is the first thing that matters about it. */}
        {entry.startsAt ? (
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {eventDate(entry.startsAt, entry.timezone)}
          </p>
        ) : null}
        <h3 className="mt-1 font-display text-lg leading-snug">{entry.title}</h3>
        {/* A service leads with who provides it; everything else leads with where. */}
        {service ? <p className="mt-1 text-sm text-foreground/80">{providerLine(entry)}</p> : null}
        <p className="mt-1 text-sm text-muted-foreground">
          {entry.place} · {entry.neighbourhood}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {entry.startsAt ? "" : `${entry.when} · `}
          {duration(entry.minutes)} · {money(entry.cost, entry.currency)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {service ? (
            <span className={CHIP}>{BOOKING_LABEL[asBookingState(entry.bookingState)]}</span>
          ) : null}
          <TrustChip entry={entry} />
          {entry.origin === "source" && entry.sourceName ? (
            <span className={CHIP}>Listed by {entry.sourceName}</span>
          ) : null}
        </div>
        {note ? <p className="mt-2 text-sm italic text-foreground/80">{note}</p> : null}
      </div>
    </>
  );

  const shell = "card-paper block w-full overflow-hidden rounded-2xl text-left";

  return (
    <article
      className={
        interactive
          ? `${shell} focus-ink cursor-pointer transition-shadow hover:shadow-lift`
          : shell
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Open listing: ${entry.title}` : undefined}
      onClick={interactive ? handleActivate : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {body}
    </article>
  );
}
