import { MAX_MAP_PINS, placeEntries, type MapView } from "./map-view";
import type { WorldEntry } from "./world-data";

export interface MapListPartition {
  /** Coordinate-backed entries the map actually renders as pins (subject to MAX_MAP_PINS). */
  inView: WorldEntry[];
  /** Entries without safe, usable coordinates. They remain available in the list. */
  unpinned: WorldEntry[];
  /** Coordinate-backed entries outside the map's renderable frame. */
  outsideView: WorldEntry[];
  /** In-frame records not pinned because the map's explicit render cap was reached. */
  unrenderedInView: WorldEntry[];
}

function hasUsableCoordinates(entry: WorldEntry): boolean {
  return (
    typeof entry.lat === "number" &&
    Number.isFinite(entry.lat) &&
    entry.lat >= -90 &&
    entry.lat <= 90 &&
    typeof entry.lng === "number" &&
    Number.isFinite(entry.lng) &&
    entry.lng >= -180 &&
    entry.lng <= 180
  );
}

/**
 * Use fresh viewport-scoped records for the map while retaining locality records
 * that cannot be safely pinned. Missing coordinates are not inferred. If a
 * record appears in both sets, the viewport representation wins.
 */
export function mergeViewportEntries(
  viewportEntries: WorldEntry[],
  localityEntries: WorldEntry[],
): WorldEntry[] {
  const viewportIds = new Set(viewportEntries.map((entry) => entry.id));
  const unpinned = localityEntries.filter(
    (entry) => !hasUsableCoordinates(entry) && !viewportIds.has(entry.id),
  );
  return [...viewportEntries, ...unpinned];
}

/**
 * Split the currently loaded locality records using the same viewport
 * projection as LivingMap. This does not fetch data, infer coordinates, or
 * change the selected discovery locality.
 */
export function partitionMapList(entries: WorldEntry[], view: MapView | null): MapListPartition {
  const unpinned = entries.filter((entry) => !hasUsableCoordinates(entry));
  const located = entries.filter(hasUsableCoordinates);

  if (!view) {
    return { inView: [], unpinned, outsideView: located, unrenderedInView: [] };
  }

  // Use the same default cap as LivingMap so the list's "in this view" items
  // correspond to actual pins. Calculate all in-frame candidates separately so
  // a reached cap is explicit instead of silently looking like missing supply.
  const rendered = placeEntries(located, view, MAX_MAP_PINS);
  const allInFrame = placeEntries(located, view, Math.max(located.length, 1));
  const renderedIds = new Set(rendered.map(({ entry }) => entry.id));
  const allInFrameIds = new Set(allInFrame.map(({ entry }) => entry.id));

  return {
    inView: rendered.map(({ entry }) => entry),
    unpinned,
    outsideView: located.filter((entry) => !allInFrameIds.has(entry.id)),
    unrenderedInView: allInFrame
      .filter(({ entry }) => !renderedIds.has(entry.id))
      .map(({ entry }) => entry),
  };
}

/** Keep in-view and unpinned entries ordered, or show every entry already loaded. */
export function entriesForMapList(
  entries: WorldEntry[],
  partition: MapListPartition,
  showAllLoaded: boolean,
): WorldEntry[] {
  if (showAllLoaded) return entries;

  const inView = new Set(partition.inView);
  const unpinned = new Set(partition.unpinned);
  return entries.filter((entry) => inView.has(entry) || unpinned.has(entry));
}
