import { placeEntries, type MapView } from "./map-view";
import type { WorldEntry } from "./world-data";

export interface MapListPartition {
  /** Coordinate-backed entries whose pins are inside the current map frame. */
  inView: WorldEntry[];
  /** Entries without safe, usable coordinates. They remain available in the list. */
  unpinned: WorldEntry[];
  /** Coordinate-backed entries outside the current frame. */
  outsideView: WorldEntry[];
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
    return { inView: [], unpinned, outsideView: located };
  }

  const visibleEntries = new Set(
    placeEntries(located, view, Math.max(located.length, 1))
      .filter(({ left, top }) => left >= 0 && left <= 100 && top >= 0 && top <= 100)
      .map(({ entry }) => entry),
  );

  return {
    inView: located.filter((entry) => visibleEntries.has(entry)),
    unpinned,
    outsideView: located.filter((entry) => !visibleEntries.has(entry)),
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
