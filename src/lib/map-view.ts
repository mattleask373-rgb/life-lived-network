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
    .filter((e) => typeof e.lat === "number" && typeof e.lng === "number")
    .map((e) => ({ lat: e.lat as number, lng: e.lng as number }));
  if (centre && typeof centre.lat === "number" && typeof centre.lng === "number") {
    points.push({ lat: centre.lat, lng: centre.lng });
  }
  if (!points.length) {
    // Nothing to look at: the whole of these islands, honestly wide.
    return { lat: 54.5, lng: -4, spanLat: 12, spanLng: 12 * aspect };
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = clampSpan(Math.max((maxLat - minLat) * 1.6, 0.04));
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
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

export function boundsOf(view: MapView): Bounds {
  return {
    minLat: view.lat - view.spanLat / 2,
    maxLat: view.lat + view.spanLat / 2,
    minLng: view.lng - view.spanLng / 2,
    maxLng: view.lng + view.spanLng / 2,
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
  return {
    left: ((point.lng - b.minLng) / (b.maxLng - b.minLng)) * 100,
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
 * Grid clustering, so a wide view shows how much is somewhere rather than a
 * thousand overlapping pins. Deterministic: same input, same clusters.
 */
export function clusterPlaced(placed: Placed[], cell = 8): Cluster[] {
  const cells = new Map<string, Placed[]>();
  for (const item of placed) {
    const key = `${Math.floor(item.left / cell)}:${Math.floor(item.top / cell)}`;
    const list = cells.get(key);
    if (list) list.push(item);
    else cells.set(key, [item]);
  }
  return [...cells.entries()]
    .map(([key, items]) => ({
      key,
      left: items.reduce((n, i) => n + i.left, 0) / items.length,
      top: items.reduce((n, i) => n + i.top, 0) / items.length,
      entries: items.map((i) => i.entry),
    }))
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
    if (place.lng < b.minLng || place.lng > b.maxLng) continue;
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
