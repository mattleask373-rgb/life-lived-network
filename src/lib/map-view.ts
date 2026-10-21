/**
 * The map viewport.
 *
 * Two different things are deliberately kept apart:
 *
 *   MAP VIEWPORT        what you are looking at. Transient, never stored.
 *   DISCOVERY LOCALITY  where you are. Persisted, and changed only when asked.
 *
 * Moving the map therefore never moves the person. These helpers are pure so
 * the same arithmetic runs in tests and on any screen size, with no map
 * provider, no tiles and no projection library.
 */

import { distanceKm, type Place, type PlaceIndex } from "./places";
import type { WorldEntry } from "./world-data";

export interface MapView {
  lat: number;
  lng: number;
  /** Degrees of latitude visible top to bottom. */
  spanLat: number;
  /** Degrees of longitude visible left to right. */
  spanLng: number;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Street level up to most of a hemisphere. */
export const MIN_SPAN = 0.004;
export const MAX_SPAN = 140;

export type Scale = "neighbourhood" | "city" | "region" | "country" | "world";

/** What the current span is honestly showing. */
export function scaleOf(view: MapView): Scale {
  const span = view.spanLat;
  if (span <= 0.06) return "neighbourhood";
  if (span <= 0.6) return "city";
  if (span <= 3) return "region";
  if (span <= 18) return "country";
  return "world";
}

export const SCALE_LABEL: Record<Scale, string> = {
  neighbourhood: "Street and neighbourhood",
  city: "Town and city",
  region: "County and region",
  country: "Country",
  world: "The wider world",
};

/**
 * A starting view: whatever has coordinates, with the locality centre included
 * so an empty locality still looks at the right part of the world.
 */
export function fitView(
  entries: WorldEntry[],
  centre: { lat: number | null; lng: number | null } | null,
  aspect = 1.4,
): MapView {
  const points = entries
    .filter(
      (entry) =>
        typeof entry.lat === "number" &&
        Number.isFinite(entry.lat) &&
        entry.lat >= -90 &&
        entry.lat <= 90 &&
        typeof entry.lng === "number" &&
        Number.isFinite(entry.lng) &&
        entry.lng >= -180 &&
        entry.lng <= 180,
    )
    .map((entry) => ({ lat: entry.lat as number, lng: entry.lng as number }));
  if (
    centre &&
    typeof centre.lat === "number" &&
    Number.isFinite(centre.lat) &&
    centre.lat >= -90 &&
    centre.lat <= 90 &&
    typeof centre.lng === "number" &&
    Number.isFinite(centre.lng) &&
    centre.lng >= -180 &&
    centre.lng <= 180
  ) {
    points.push({ lat: centre.lat, lng: centre.lng });
  }
  if (!points.length) {
    // Nothing to look at: the whole of these islands, honestly wide.
    return { lat: 54.5, lng: -4, spanLat: 12, spanLng: 12 * aspect };
  }
  const lats = points.map((p) => p.lat);
  const referenceLng =
    centre &&
    typeof centre.lng === "number" &&
    Number.isFinite(centre.lng) &&
    centre.lng >= -180 &&
    centre.lng <= 180
      ? centre.lng
      : (points[0]?.lng ?? 0);
  // Unwrap points relative to a stable reference so places at +175° and -175°
  // fit a local viewport around the date line instead of a 350° span.
  const lngs = points.map((point) => referenceLng + longitudeOffset(point.lng, referenceLng));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = clampSpan(Math.max((maxLat - minLat) * 1.6, 0.04));
  return {
    lat: (minLat + maxLat) / 2,
    lng: normaliseLongitude((minLng + maxLng) / 2),
    spanLat,
    spanLng: clampSpan(Math.max(spanLat * aspect, (maxLng - minLng) * 1.4)),
  };
}

function clampSpan(span: number): number {
  if (!Number.isFinite(span)) return 1;
  return Math.min(MAX_SPAN, Math.max(MIN_SPAN, span));
}

/** Zoom about the centre. factor < 1 zooms in. */
export function zoomView(view: MapView, factor: number): MapView {
  const aspect = view.spanLng / view.spanLat || 1.4;
  const spanLat = clampSpan(view.spanLat * factor);
  return { ...view, spanLat, spanLng: clampSpan(spanLat * aspect) };
}

/** Drag, expressed as a fraction of the visible width and height. */
export function panView(view: MapView, dxFraction: number, dyFraction: number): MapView {
  const lat = Math.min(85, Math.max(-85, view.lat + dyFraction * view.spanLat));
  let lng = view.lng + dxFraction * view.spanLng;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return { ...view, lat, lng };
}

function normaliseLongitude(longitude: number): number {
  const shifted = longitude + 180;
  const wrapped = ((shifted % 360) + 360) % 360;
  return wrapped - 180;
}

/** Shortest signed longitude offset from the viewport centre, in [-180, 180). */
function longitudeOffset(longitude: number, centre: number): number {
  return normaliseLongitude(longitude - centre);
}

/** True when a longitude falls inside a viewport, including a date-line crossing. */
export function longitudeInView(longitude: number, view: MapView): boolean {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return false;
  if (
    !Number.isFinite(view.lng) ||
    !Number.isFinite(view.spanLng) ||
    view.spanLng <= 0 ||
    view.spanLng >= 360
  ) {
    return false;
  }
  return Math.abs(longitudeOffset(longitude, view.lng)) <= view.spanLng / 2;
}

/**
 * Visible bounds use normalised longitudes. If minLng > maxLng the viewport
 * crosses +180°/-180°, matching the server's GeoBounds contract.
 */
export function boundsOf(view: MapView): Bounds {
  return {
    minLat: view.lat - view.spanLat / 2,
    maxLat: view.lat + view.spanLat / 2,
    minLng: normaliseLongitude(view.lng - view.spanLng / 2),
    maxLng: normaliseLongitude(view.lng + view.spanLng / 2),
  };
}

export interface Placed {
  entry: WorldEntry;
  /** Percentages of the frame. Outside 0–100 means off screen. */
  left: number;
  top: number;
}

/** Real coordinates to a position in the frame, for the current viewport only. */
export function toScreen(
  point: { lat: number; lng: number },
  view: MapView,
): { left: number; top: number } {
  const b = boundsOf(view);
  // Use the shortest signed longitude offset so points either side of the
  // international date line stay adjacent in the rendered map.
  const offset = longitudeOffset(point.lng, view.lng);
  return {
    left: ((offset + view.spanLng / 2) / view.spanLng) * 100,
    // Latitude increases northwards; the screen increases downwards.
    top: ((b.maxLat - point.lat) / (b.maxLat - b.minLat)) * 100,
  };
}

/** Only what the viewport can actually show, and only what has coordinates. */
export function placeEntries(entries: WorldEntry[], view: MapView, limit = 300): Placed[] {
  const placed: Placed[] = [];
  for (const entry of entries) {
    if (typeof entry.lat !== "number" || typeof entry.lng !== "number") continue;
    const { left, top } = toScreen({ lat: entry.lat, lng: entry.lng }, view);
    if (left < -4 || left > 104 || top < -4 || top > 104) continue;
    placed.push({ entry, left, top });
    if (placed.length >= limit) break;
  }
  return placed;
}

export interface Cluster {
  key: string;
  left: number;
  top: number;
  entries: WorldEntry[];
}

/**
 * Cluster markers whose interactive hit areas would overlap.
 *
 * Coordinates are percentages of the visible frame. Callers pass separate
 * horizontal and vertical thresholds derived from the rendered map dimensions,
 * so a 48px minimum spacing stays 48px on both a phone and a desktop map.
 * Nearby markers are joined across grid boundaries; identical input gives
 * deterministic output.
 */
export function clusterPlaced(placed: Placed[], cellX = 8, cellY = cellX): Cluster[] {
  if (placed.length === 0) return [];
  const xThreshold = Number.isFinite(cellX) && cellX > 0 ? cellX : 8;
  const yThreshold = Number.isFinite(cellY) && cellY > 0 ? cellY : xThreshold;
  const parents = placed.map((_, index) => index);

  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const next = parents[index];
      parents[index] = root;
      index = next;
    }
    return root;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };

  // Spatial buckets keep comparisons local rather than comparing every pair.
  const buckets = new Map<string, number[]>();
  placed.forEach((item, index) => {
    const x = Math.floor(item.left / xThreshold);
    const y = Math.floor(item.top / yThreshold);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const nearby = buckets.get(`${x + dx}:${y + dy}`) ?? [];
        for (const otherIndex of nearby) {
          const other = placed[otherIndex];
          if (
            other &&
            Math.abs(item.left - other.left) < xThreshold &&
            Math.abs(item.top - other.top) < yThreshold
          ) {
            union(index, otherIndex);
          }
        }
      }
    }
    const key = `${x}:${y}`;
    const items = buckets.get(key);
    if (items) items.push(index);
    else buckets.set(key, [index]);
  });

  const groups = new Map<number, Placed[]>();
  placed.forEach((item, index) => {
    const root = find(index);
    const group = groups.get(root);
    if (group) group.push(item);
    else groups.set(root, [item]);
  });

  return [...groups.values()]
    .map((items) => {
      const ids = items.map((item) => item.entry.id).sort();
      return {
        key: ids.join("|"),
        left: items.reduce((sum, item) => sum + item.left, 0) / items.length,
        top: items.reduce((sum, item) => sum + item.top, 0) / items.length,
        entries: items.map((item) => item.entry),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * The place the map is currently looking at, if geography knows one. Used to
 * offer — never to impose — a change of locality.
 */
export function placeInView(
  index: PlaceIndex,
  view: MapView,
  exclude?: string | null,
): Place | null {
  const b = boundsOf(view);
  let best: { place: Place; distance: number } | null = null;
  for (const place of index.byId.values()) {
    if (place.id === exclude) continue;
    if (typeof place.lat !== "number" || typeof place.lng !== "number") continue;
    if (place.lat < b.minLat || place.lat > b.maxLat) continue;
    if (!longitudeInView(place.lng, view)) continue;
    const distance =
      distanceKm({ lat: view.lat, lng: view.lng }, { lat: place.lat, lng: place.lng }) ?? Infinity;
    // A place whose own size suits the current span reads best: a county when
    // zoomed out, a neighbourhood when zoomed in.
    const suits = suitability(place.kind, view.spanLat);
    const score = distance + suits;
    if (!best || score < best.distance) best = { place, distance: score };
  }
  return best?.place ?? null;
}

function suitability(kind: Place["kind"], spanLat: number): number {
  const ideal: Record<string, number> = {
    neighbourhood: 0.03,
    village: 0.08,
    town: 0.2,
    city: 0.5,
    area: 2,
    region: 5,
    country: 12,
  };
  const want = ideal[kind] ?? 1;
  // Penalty grows with how wrong the scale is, in kilometre-ish units.
  return Math.abs(Math.log(spanLat / want)) * 30;
}
