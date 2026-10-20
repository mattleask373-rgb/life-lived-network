import { MapPin } from "lucide-react";

import { LAYERS, type WorldEntry } from "@/lib/world-data";
import { asBookingState, BOOKING_LABEL, isService, providerLine } from "@/lib/services";
import { duration, eventDate, layerText, money } from "./layer-colour";
import { LayerIcon } from "./layer-icon";
import { TrustChip } from "./trust-chip";

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
  const photo = entry.photos?.find((item) => Boolean(item.url));
  const service = isService(entry);

  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-deep">
        {photo ? (
          <img
            src={photo.url}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div
            role="img"
            aria-label="No photograph supplied for this listing"
            className="photo-placeholder flex h-full items-center justify-center"
          >
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/85 px-3 py-2 text-xs font-medium text-muted-foreground">
              {layer ? <LayerIcon icon={layer.icon} size={16} strokeWidth={1.7} /> : null}
              No photo supplied
            </div>
          </div>
        )}

        {photo?.credit ? (
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-lg bg-ink/80 px-2 py-1 text-[0.65rem] text-card">
            Photo: {photo.credit}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${layerText[entry.layer]}`}>
            {layer ? <LayerIcon icon={layer.icon} size={15} strokeWidth={1.7} /> : null}
            {layer?.label}
          </span>
          {entry.demonstration ? (
            <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-sand px-2.5 text-[0.7rem] font-semibold text-foreground">
              Demonstration
            </span>
          ) : null}
        </div>

        {entry.startsAt ? (
          <p className="mt-2 text-sm font-semibold text-foreground">
            {eventDate(entry.startsAt, entry.timezone)}
          </p>
        ) : null}

        <h3 className="mt-2 font-display text-xl leading-snug text-foreground">{entry.title}</h3>

        {service ? (
          <p className="mt-1 text-sm text-foreground/85">{providerLine(entry)}</p>
        ) : null}

        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{entry.place} · {entry.neighbourhood}</span>
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          {entry.startsAt ? "" : `${entry.when} · `}
          {duration(entry.minutes)} · {money(entry.cost, entry.currency)}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {service ? (
            <span className="inline-flex min-h-7 items-center rounded-full border border-border px-2.5 text-[0.7rem] text-muted-foreground">
              {BOOKING_LABEL[asBookingState(entry.bookingState)]}
            </span>
          ) : null}
          <TrustChip entry={entry} />
          {entry.origin === "source" && entry.sourceName ? (
            <span className="inline-flex min-h-7 items-center rounded-full border border-border px-2.5 text-[0.7rem] text-muted-foreground">
              Listed by {entry.sourceName}
            </span>
          ) : null}
        </div>

        {note ? <p className="mt-3 text-sm italic text-foreground/80">{note}</p> : null}
      </div>
    </>
  );

  if (!onOpen) {
    return <article className="card-paper group flex h-full flex-col overflow-hidden text-left">{body}</article>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="card-paper focus-ink group flex h-full w-full flex-col overflow-hidden text-left transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transform-none"
    >
      {body}
    </button>
  );
}
