import { LAYERS, type WorldEntry } from "@/lib/world-data";
import { duration, layerText, money } from "./layer-colour";
import { LayerIcon } from "./layer-icon";

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
      <h3 className="mt-1 text-base leading-snug">{entry.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {entry.place} · {entry.neighbourhood}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {entry.when} · {duration(entry.minutes)} · {money(entry.cost)}
      </p>
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
