import { LAYERS, type WorldEntry } from "@/lib/world-data";
import { layerBg } from "./layer-colour";
import { LayerIcon } from "./layer-icon";

interface Props {
  entries: WorldEntry[];
  activeId?: string | undefined;
  onSelect: (entry: WorldEntry) => void;
}

/**
 * A hand-drawn map of a real place.
 *
 * The geometry is deliberately illustrative rather than survey-accurate, and the
 * pin positions are approximate — no exact personal locations are ever plotted.
 * The rendering is isolated here so a real map provider can replace it later.
 */
export function LivingMap({ entries, activeId, onSelect }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-land">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="100" height="100" className="fill-land" />
        {/* higher ground */}
        <path
          d="M0 30 C14 22 26 34 38 27 C52 19 62 31 74 24 C86 17 94 27 100 22 L100 0 L0 0 Z"
          className="fill-land-high"
          opacity="0.8"
        />
        {/* forest to the west */}
        <path
          d="M2 36 C10 30 20 34 24 42 C28 52 18 58 9 54 C1 50 -2 42 2 36 Z"
          className="fill-forest"
          opacity="0.75"
        />
        {/* the river, wide and low */}
        <path
          d="M0 74 C18 66 34 78 52 72 C70 66 84 76 100 68 L100 100 L0 100 Z"
          className="fill-water"
        />
        {/* streets, drawn loosely */}
        <g className="stroke-ink" opacity="0.14" strokeWidth="0.35" fill="none">
          <path d="M6 62 C24 58 40 64 58 56 C74 49 88 54 99 47" />
          <path d="M12 30 C22 44 30 52 42 58 C56 65 66 66 78 62" />
          <path d="M52 12 C54 30 56 44 58 62" />
          <path d="M78 16 C74 32 76 46 82 60" />
          <path d="M28 18 C34 32 34 44 30 58" />
        </g>
      </svg>

      {/* Pins */}
      {entries.map((entry) => {
        const active = entry.id === activeId;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry)}
            aria-label={`${entry.title} — ${entry.place}`}
            aria-pressed={active}
            className="focus-ink absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${entry.x}%`, top: `${entry.y}%` }}
          >
            <span className="flex flex-col items-center">
              <span
                className={`grid place-items-center rounded-full border border-card text-[0.72rem] shadow-lift transition-transform ${
                  layerBg[entry.layer]
                } ${active ? "h-9 w-9 scale-110" : "h-7 w-7 hover:scale-110"}`}
              >
                 {(() => {
                   const layer = LAYERS.find((item) => item.id === entry.layer);
                   return layer ? <LayerIcon icon={layer.icon} size={active ? 17 : 14} strokeWidth={1.8} /> : null;
                 })()}
              </span>
              <span className="h-2 w-px bg-ink/40" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
