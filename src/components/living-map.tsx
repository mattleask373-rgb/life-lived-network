import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Crosshair } from "lucide-react";

import { LAYERS, type WorldEntry } from "@/lib/world-data";
import {
  SCALE_LABEL,
  clusterPlaced,
  fitView,
  placeEntries,
  panView,
  scaleOf,
  zoomView,
  type MapView,
} from "@/lib/map-view";
import { layerBg } from "./layer-colour";
import { LayerIcon } from "./layer-icon";

interface Props {
  entries: WorldEntry[];
  activeId?: string | undefined;
  onSelect: (entry: WorldEntry) => void;
  /** Approximate centre of the locality being looked at, when it is known. */
  centre?: { lat: number | null; lng: number | null } | null;
  /** Name of the locality, for the "back to here" control. */
  centreName?: string | undefined;
  /** Somewhere the viewport has wandered over, offered but never imposed. */
  area?: { name: string; slug: string } | null;
  onExploreArea?: ((slug: string) => void) | undefined;
  onViewChange?: ((view: MapView) => void) | undefined;
}

/**
 * A hand-drawn map you can actually move around.
 *
 * The backdrop stays illustrative — no tiles, no provider, no survey accuracy —
 * but the pins come from real approximate coordinates and are projected for the
 * current viewport, so the same map works for a street, a county or a country.
 * Panning and zooming change only what you are looking at; where you are is a
 * separate, persisted choice that changes only when you ask it to.
 */
export function LivingMap({
  entries,
  activeId,
  onSelect,
  centre,
  centreName,
  area,
  onExploreArea,
  onViewChange,
}: Props) {
  const home = useMemo(() => fitView(entries, centre ?? null), [entries, centre]);
  const [view, setView] = useState<MapView>(home);
  const frame = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [moved, setMoved] = useState(false);

  // A new locality (or its first activity) resets the view to fit it.
  useEffect(() => {
    setView(home);
    setMoved(false);
  }, [home]);

  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  const change = useCallback((next: MapView) => {
    setView(next);
    setMoved(true);
  }, []);

  const placed = useMemo(() => placeEntries(entries, view), [entries, view]);
  const scale = scaleOf(view);
  // Wide views cluster; close up, every pin is its own.
  const clusters = useMemo(
    () => clusterPlaced(placed, scale === "neighbourhood" ? 3 : 8),
    [placed, scale],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const start = drag.current;
    const box = frame.current?.getBoundingClientRect();
    if (!start || !box) return;
    const dx = (e.clientX - start.x) / box.width;
    const dy = (e.clientY - start.y) / box.height;
    if (Math.abs(dx) < 0.002 && Math.abs(dy) < 0.002) return;
    drag.current = { x: e.clientX, y: e.clientY };
    change(panView(view, -dx, dy));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return;
    e.preventDefault();
    change(zoomView(view, e.deltaY > 0 ? 1.2 : 1 / 1.2));
  };

  return (
    <div
      ref={frame}
      className="relative h-full w-full touch-none select-none overflow-hidden rounded-xl border border-border bg-land"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
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

      {clusters.map((cluster) => {
        const first = cluster.entries[0];
        if (!first) return null;
        if (cluster.entries.length === 1) {
          const active = first.id === activeId;
          const layer = LAYERS.find((item) => item.id === first.layer);
          return (
            <button
              key={cluster.key}
              type="button"
              onClick={() => onSelect(first)}
              aria-label={`${first.title} — ${first.place}`}
              aria-pressed={active}
              className="focus-ink absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${cluster.left}%`, top: `${cluster.top}%` }}
            >
              <span className="flex flex-col items-center">
                <span
                  className={`grid place-items-center rounded-full border border-card text-[0.72rem] shadow-lift transition-transform ${
                    layerBg[first.layer]
                  } ${active ? "h-9 w-9 scale-110" : "h-7 w-7 hover:scale-110"}`}
                >
                  {layer ? (
                    <LayerIcon icon={layer.icon} size={active ? 17 : 14} strokeWidth={1.8} />
                  ) : null}
                </span>
                <span className="h-2 w-px bg-ink/40" />
              </span>
            </button>
          );
        }
        return (
          <button
            key={cluster.key}
            type="button"
            onClick={() => change(zoomView({ ...view, lat: view.lat, lng: view.lng }, 0.45))}
            aria-label={`${cluster.entries.length} things here — zoom in to see them`}
            className="focus-ink absolute -translate-x-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-card bg-card/90 text-sm shadow-lift hover:scale-110"
            style={{ left: `${cluster.left}%`, top: `${cluster.top}%` }}
          >
            {cluster.entries.length}
          </button>
        );
      })}

      {/* Controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => change(zoomView(view, 1 / 1.5))}
          aria-label="Zoom in"
          className="focus-ink grid h-9 w-9 place-items-center rounded-full border border-border bg-card shadow-lift"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => change(zoomView(view, 1.5))}
          aria-label="Zoom out"
          className="focus-ink grid h-9 w-9 place-items-center rounded-full border border-border bg-card shadow-lift"
        >
          <Minus size={16} />
        </button>
        {moved ? (
          <button
            type="button"
            onClick={() => {
              setView(home);
              setMoved(false);
            }}
            aria-label={centreName ? `Back to ${centreName}` : "Back to where you are"}
            className="focus-ink grid h-9 w-9 place-items-center rounded-full border border-border bg-card shadow-lift"
          >
            <Crosshair size={16} />
          </button>
        ) : null}
      </div>

      <p className="pointer-events-none absolute bottom-2 left-3 text-xs text-muted-foreground">
        {SCALE_LABEL[scale]}
      </p>

      {moved && area && onExploreArea ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs shadow-lift">
          <span className="text-muted-foreground">Looking at {area.name}.</span>{" "}
          <button
            type="button"
            onClick={() => onExploreArea(area.slug)}
            className="focus-ink underline"
          >
            Make this my area
          </button>
        </div>
      ) : null}
    </div>
  );
}
