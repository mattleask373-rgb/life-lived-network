import { useMemo } from "react";

import { LAYERS, type WorldEntry } from "@/lib/world-data";
import { layerBg } from "./layer-colour";
import { LayerIcon } from "./layer-icon";

interface Props {
  entries: WorldEntry[];
  activeId?: string | undefined;
  onSelect: (entry: WorldEntry) => void;
  /** Approximate centre of the locality being looked at, when it is known. */
  centre?: { lat: number | null; lng: number | null } | null;
}

/**
 * A hand-drawn map of a real place.
 *
 * The geometry is deliberately illustrative rather than survey-accurate, but
 * the pin positions are now derived from real approximate coordinates around
 * the locality being looked at, so the same map works for a neighbourhood, a
 * rural county or a whole country. Entries with no coordinates fall back to
 * their illustrative position. No exact personal locations are ever plotted,
 * and no external map provider is involved.
 */
export function LivingMap({ entries, activeId, onSelect, centre }: Props) {
  const placed = useMemo(() => project(entries, centre ?? null), [entries, centre]);

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
        {/* woodland */}
        <path
          d="M2 36 C10 30 20 34 24 42 C28 52 18 58 9 54 C1 50 -2 42 2 36 Z"
          className="fill-forest"
          opacity="0.75"
        />
        {/* water, low and wide */}
        <path
          d="M0 74 C18 66 34 78 52 72 C70 66 84 76 100 68 L100 100 L0 100 Z"
          className="fill-water"
        />
        {/* roads and lanes, drawn loosely */}
        <g className="stroke-ink" opacity="0.14" strokeWidth="0.35" fill="none">
          <path d="M6 62 C24 58 40 64 58 56 C74 49 88 54 99 47" />
          <path d="M12 30 C22 44 30 52 42 58 C56 65 66 66 78 62" />
          <path d="M52 12 C54 30 56 44 58 62" />
          <path d="M78 16 C74 32 76 46 82 60" />
          <path d="M28 18 C34 32 34 44 30 58" />
        </g>
      </svg>

      {/* Pins */}
      {placed.map(({ entry, left, top }) => {
        const active = entry.id === activeId;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry)}
            aria-label={`${entry.title} — ${entry.place}`}
            aria-pressed={active}
            className="focus-ink absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="flex flex-col items-center">
              <span
                className={`grid place-items-center rounded-full border border-card text-[0.72rem] shadow-lift transition-transform ${
                  layerBg[entry.layer]
                } ${active ? "h-9 w-9 scale-110" : "h-7 w-7 hover:scale-110"}`}
              >
                {(() => {
                  const layer = LAYERS.find((item) => item.id === entry.layer);
                  return layer ? (
                    <LayerIcon icon={layer.icon} size={active ? 17 : 14} strokeWidth={1.8} />
                  ) : null;
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

interface Placed {
  entry: WorldEntry;
  left: number;
  top: number;
}

const MIN_SPAN = 0.06; // degrees, so a single pin isn't zoomed to infinity

/**
 * Real coordinates to percentages inside the drawn frame.
 *
 * A plain equirectangular fit of whatever is on screen: correct enough for an
 * illustrative map at any scale, with no projection library and no tiles.
 */
export function project(
  entries: WorldEntry[],
  centre: { lat: number | null; lng: number | null } | null,
): Placed[] {
  const points = entries.filter(
    (e) => typeof e.lat === "number" && typeof e.lng === "number",
  ) as (WorldEntry & { lat: number; lng: number })[];

  if (!points.length) {
    return entries.map((entry) => ({ entry, left: clamp(entry.x), top: clamp(entry.y) }));
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  if (centre && typeof centre.lat === "number" && typeof centre.lng === "number") {
    lats.push(centre.lat);
    lngs.push(centre.lng);
  }

  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  const padLat = Math.max((maxLat - minLat) * 0.15, MIN_SPAN / 2);
  const padLng = Math.max((maxLng - minLng) * 0.15, MIN_SPAN / 2);
  minLat -= padLat;
  maxLat += padLat;
  minLng -= padLng;
  maxLng += padLng;

  const spanLat = maxLat - minLat || MIN_SPAN;
  const spanLng = maxLng - minLng || MIN_SPAN;

  return entries.map((entry) => {
    if (typeof entry.lat !== "number" || typeof entry.lng !== "number") {
      return { entry, left: clamp(entry.x), top: clamp(entry.y) };
    }
    const left = ((entry.lng - minLng) / spanLng) * 100;
    // Latitude increases northwards; the screen increases downwards.
    const top = ((maxLat - entry.lat) / spanLat) * 100;
    return { entry, left: clamp(left), top: clamp(top) };
  });
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(96, Math.max(4, value));
}
