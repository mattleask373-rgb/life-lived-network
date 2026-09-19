/**
 * Road trips: geography and time laid over the world that already exists.
 *
 * This adds no second discovery engine. It works out which localities a journey
 * passes through, then the ordinary bounded world read answers what is there.
 * Nothing is scored and nothing is ranked opaquely: each result carries only the
 * reasons it can prove, ordered by how far along the route it is and then by how
 * far off the route it sits.
 *
 * Route distances, durations and true detours require a routing provider. Until
 * one is connected the corridor is a straight line between the two places and
 * detours are reported as unavailable rather than estimated.
 */

import { descendantIdsOf, distanceKm, type Place, type PlaceIndex } from "./places";
import type { WorldEntry } from "./world-data";

export type TravelMode = "driving" | "walking" | "cycling" | "public_transport";

export const TRAVEL_MODES: { id: TravelMode; label: string }[] = [
  { id: "driving", label: "Driving" },
  { id: "walking", label: "Walking" },
  { id: "cycling", label: "Cycling" },
  { id: "public_transport", label: "Public transport" },
];

export interface RoutePlan {
  from: Place;
  to: Place;
  mode: TravelMode;
  /** ISO date, when the traveller said one. */
  date?: string | undefined;
  interests: string[];
}

/** What a provider would give us. Null fields mean "we honestly do not know". */
export interface RouteSummary {
  straightLineKm: number | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  /** The name of whatever supplied the route, or null when nothing did. */
  source: string | null;
}

export function straightLineSummary(plan: RoutePlan): RouteSummary {
  return {
    straightLineKm: distanceKm(plan.from, plan.to),
    distanceKm: null,
    durationMinutes: null,
    source: null,
  };
}

/** Half-width of the corridor either side of the line, by mode. */
export function corridorWidthKm(mode: TravelMode, routeKm: number | null): number {
  const base: Record<TravelMode, number> = {
    walking: 2,
    cycling: 5,
    public_transport: 8,
    driving: 15,
  };
  const width = base[mode];
  if (!routeKm) return width;
  // Longer journeys tolerate a slightly wider corridor, but never unboundedly.
  return Math.min(width * 3, Math.max(width, routeKm * 0.06));
}

export interface CorridorPlace {
  place: Place;
  /** 0 at the origin, 1 at the destination. */
  position: number;
  /** Straight-line distance from the line of travel. */
  offRouteKm: number;
}

/**
 * Localities the journey passes through or close to. Bounded: the corridor is
 * capped so a long trip cannot produce an unbounded query.
 */
export function corridorPlaces(
  index: PlaceIndex,
  plan: RoutePlan,
  widthKm: number,
  limit = 60,
): CorridorPlace[] {
  const { from, to } = plan;
  if (from.lat === null || from.lng === null || to.lat === null || to.lng === null) return [];
  const found: CorridorPlace[] = [];
  for (const place of index.byId.values()) {
    if (place.lat === null || place.lng === null) continue;
    if (place.kind === "country" || place.kind === "region") continue;
    const measured = offRoute(from, to, place);
    if (measured === null) continue;
    if (measured.offRouteKm > widthKm) continue;
    found.push({ place, position: measured.position, offRouteKm: measured.offRouteKm });
  }
  found.sort(
    (a, b) =>
      a.position - b.position ||
      a.offRouteKm - b.offRouteKm ||
      a.place.name.localeCompare(b.place.name),
  );
  return found.slice(0, limit);
}

interface Point {
  lat: number | null;
  lng: number | null;
}

/**
 * How far a point sits from the line of travel, and how far along it is.
 * Flat-earth arithmetic over a few hundred kilometres: honest enough for
 * "roughly on the way", and never presented as a routed distance.
 */
export function offRoute(
  from: Point,
  to: Point,
  point: Point,
): { position: number; offRouteKm: number } | null {
  if (
    from.lat === null ||
    from.lng === null ||
    to.lat === null ||
    to.lng === null ||
    point.lat === null ||
    point.lng === null
  ) {
    return null;
  }
  const kmPerLat = 111.2;
  const midLat = ((from.lat + to.lat) / 2) * (Math.PI / 180);
  const kmPerLng = 111.2 * Math.cos(midLat);
  const ax = from.lng * kmPerLng;
  const ay = from.lat * kmPerLat;
  const bx = to.lng * kmPerLng;
  const by = to.lat * kmPerLat;
  const px = point.lng * kmPerLng;
  const py = point.lat * kmPerLat;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    const d = Math.hypot(px - ax, py - ay);
    return { position: 0, offRouteKm: Math.round(d * 10) / 10 };
  }
  const t = ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  const clamped = Math.min(1, Math.max(0, t));
  const cx = ax + clamped * dx;
  const cy = ay + clamped * dy;
  const offRouteKm = Math.round(Math.hypot(px - cx, py - cy) * 10) / 10;
  return { position: Math.round(clamped * 1000) / 1000, offRouteKm };
}

export type DiscoveryGroup = "on_route" | "small_detour" | "at_destination" | "near_start";

export const GROUP_LABEL: Record<DiscoveryGroup, string> = {
  near_start: "Before you set off",
  on_route: "Along your route",
  small_detour: "A small detour",
  at_destination: "Where you are heading",
};

export interface Discovery {
  entry: WorldEntry;
  group: DiscoveryGroup;
  position: number;
  offRouteKm: number;
  /** Only things we can actually show a source for. */
  reasons: string[];
}

export interface DiscoveryInput {
  entries: WorldEntry[];
  plan: RoutePlan;
  /** Corridor localities, by place id, from corridorPlaces(). */
  corridor: Map<string, CorridorPlace>;
  destinationIds: Set<string>;
  routed: boolean;
}

/** Evidence, never a score. Same input, same order, every time. */
export function routeDiscoveries(input: DiscoveryInput, limit = 60): Discovery[] {
  const { entries, plan, corridor, destinationIds, routed } = input;
  const interests = plan.interests.map((i) => i.toLowerCase()).filter(Boolean);
  const results: Discovery[] = [];

  for (const entry of entries) {
    if (entry.cancellation === "cancelled") continue;
    const placeId = entry.placeId ?? null;
    const inDestination = placeId ? destinationIds.has(placeId) : false;
    const corridorHit = placeId ? corridor.get(placeId) : undefined;
    let position = inDestination ? 1 : (corridorHit?.position ?? null);
    let offRouteKm = inDestination ? 0 : (corridorHit?.offRouteKm ?? null);

    if (position === null || offRouteKm === null) {
      // No place id we know: fall back to the entry's own approximate point.
      const measured = offRoute(plan.from, plan.to, {
        lat: entry.lat ?? null,
        lng: entry.lng ?? null,
      });
      if (!measured) continue;
      const width = corridorWidthKm(plan.mode, distanceKm(plan.from, plan.to));
      if (measured.offRouteKm > width) continue;
      position = measured.position;
      offRouteKm = measured.offRouteKm;
    }

    const reasons: string[] = [];
    if (inDestination) reasons.push("At your destination");
    else if (offRouteKm <= 3) reasons.push("Along your route");
    else reasons.push(`About ${offRouteKm} km off your route, as the crow flies`);
    if (!routed) reasons.push("Detour driving time unavailable until a route provider is connected");
    if (plan.date && entry.startsAt && entry.startsAt.slice(0, 10) === plan.date) {
      reasons.push("Happening on your travel date");
    }
    if (entry.sourceName) reasons.push(`Listed by ${entry.sourceName}`);
    if (entry.demonstration) reasons.push("Demonstration record, not live information");
    const text = `${entry.title} ${entry.summary} ${(entry.skills ?? []).join(" ")}`.toLowerCase();
    const matched = interests.find((i) => text.includes(i));
    if (matched) reasons.push(`Matches what you said you like: ${matched}`);

    results.push({
      entry,
      group: groupOf(position, offRouteKm, inDestination),
      position,
      offRouteKm,
      reasons,
    });
  }

  results.sort(
    (a, b) =>
      a.position - b.position ||
      a.offRouteKm - b.offRouteKm ||
      a.entry.title.localeCompare(b.entry.title),
  );
  return results.slice(0, limit);
}

function groupOf(position: number, offRouteKm: number, inDestination: boolean): DiscoveryGroup {
  if (inDestination || position >= 0.95) return "at_destination";
  if (position <= 0.05) return "near_start";
  if (offRouteKm <= 3) return "on_route";
  return "small_detour";
}

/** The place ids a corridor query should ask about, destination included. */
export function corridorPlaceIds(
  index: PlaceIndex,
  plan: RoutePlan,
  corridor: CorridorPlace[],
  limit = 200,
): string[] {
  const ids = new Set<string>();
  for (const id of descendantIdsOf(index, plan.to.id)) ids.add(id);
  for (const hit of corridor) {
    ids.add(hit.place.id);
    if (ids.size >= limit) break;
  }
  return [...ids].slice(0, limit);
}
