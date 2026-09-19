import { LAYERS, type WorldEntry } from "@/lib/world-data";
import { duration, layerText, money } from "./layer-colour";
import { LayerIcon } from "./layer-icon";

/** A real date and time, in the time zone where it is actually happening. */
export function eventDate(startsAt: string, timezone?: string): string {
  const at = new Date(startsAt);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...(timezone ? { timeZone: timezone } : {}),
  });
}

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
  const body = (
    <>
      <div className="flex items-center gap-2">
        {layer ? <LayerIcon icon={layer.icon} size={15} strokeWidth={1.7} /> : null}
        <span className={`text-xs uppercase tracking-widest ${layerText[entry.layer]}`}>
          {layer?.label}
        </span>
      </div>
      {/* An event's date is the first thing that matters about it. */}
      {entry.startsAt ? (
        <p className="mt-1 text-sm font-medium text-foreground">
          {eventDate(entry.startsAt, entry.timezone)}
        </p>
      ) : null}
      <h3 className="mt-1 text-base leading-snug">{entry.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {entry.place} · {entry.neighbourhood}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {entry.startsAt ? "" : `${entry.when} · `}
        {duration(entry.minutes)} · {money(entry.cost, entry.currency)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {entry.demonstration ? (
          <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
            Demonstration
          </span>
        ) : null}
        {entry.origin === "source" && entry.sourceName ? (
          <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            Listed by {entry.sourceName}
          </span>
        ) : null}
      </div>
      {note ? <p className="mt-2 text-sm text-foreground/80 italic">{note}</p> : null}
    </>
  );

  if (!onOpen) return <div className="card-paper p-4 text-left">{body}</div>;

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="card-paper focus-ink w-full p-4 text-left transition-shadow hover:shadow-lift"
    >
      {body}
    </button>
  );
}
