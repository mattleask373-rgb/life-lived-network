/**
 * Places — the geography spine.
 *
 * Until now the world was one hard-coded city. A place is now a real record
 * with a hierarchy (country → region → city → town → village → neighbourhood),
 * a slug, real coordinates, a timezone and a currency. Everything the app
 * eventually needs — "near me", "within 30 minutes", along a route, locality
 * pages — hangs off this.
 *
 * Coordinates here are place-level and approximate by design. Nobody's home
 * address ever becomes a coordinate.
 */

import { supabase } from "@/integrations/supabase/client";

export type PlaceKind =
  | "country"
  | "region"
  | "area"
  | "city"
  | "town"
  | "village"
  | "neighbourhood";

export interface Place {
  id: string;
  parent_id: string | null;
  kind: PlaceKind;
  name: string;
  slug: string;
  country_code: string;
  timezone: string;
  currency: string;
  lat: number | null;
  lng: number | null;
  blurb: string;
}

/** Where the world currently has enough density to be worth opening on. */
export const DEFAULT_PLACE_SLUG = "lisbon";

/** Used only while the real place record is still loading. */
export const PLACE_FALLBACK = {
  name: "Lisbon",
  region: "Portugal",
  blurb: "Seven hills, a wide river, and a lot of people making things.",
};

const KINDS: PlaceKind[] = [
  "country",
  "region",
  "area",
  "city",
  "town",
  "village",
  "neighbourhood",
];

interface PlaceRow {
  id: string;
  parent_id: string | null;
  kind: string;
  name: string;
  slug: string;
  country_code: string;
  timezone: string;
  currency: string;
  lat: number | string | null;
  lng: number | string | null;
  blurb: string;
}

function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    parent_id: row.parent_id,
    kind: (KINDS as string[]).includes(row.kind) ? (row.kind as PlaceKind) : "city",
    name: row.name,
    slug: row.slug,
    country_code: row.country_code,
    timezone: row.timezone,
    currency: row.currency,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    blurb: row.blurb,
  };
}

const SELECT =
  "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";

/** A place and, if it has one, the place it sits inside. */
export interface ResolvedPlace {
  place: Place;
  parent: Place | null;
}

export async function fetchPlaceBySlug(slug: string): Promise<ResolvedPlace | null> {
  const { data, error } = await supabase
    .from("places")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const place = toPlace(data as unknown as PlaceRow);
  let parent: Place | null = null;
  if (place.parent_id) {
    const { data: up } = await supabase
      .from("places")
      .select(SELECT)
      .eq("id", place.parent_id)
      .maybeSingle();
    if (up) parent = toPlace(up as unknown as PlaceRow);
  }
  return { place, parent };
}

/** The place the app opens on, until people can choose their own. */
export function fetchDefaultPlace(): Promise<ResolvedPlace | null> {
  return fetchPlaceBySlug(DEFAULT_PLACE_SLUG);
}

/** Every place someone can currently attach something to. */
export async function fetchPlaces(kinds?: PlaceKind[]): Promise<Place[]> {
  let query = supabase.from("places").select(SELECT).order("name");
  if (kinds?.length) query = query.in("kind", kinds);
  const { data, error } = await query.limit(500);
  if (error) throw error;
  return ((data ?? []) as unknown as PlaceRow[]).map(toPlace);
}

/** "Lisbon, Portugal" — whatever depth we actually know. */
export function placeLabel(resolved: ResolvedPlace | null | undefined): string {
  if (!resolved) return PLACE_FALLBACK.name;
  return resolved.parent
    ? `${resolved.place.name}, ${resolved.parent.name}`
    : resolved.place.name;
}

/** Rough straight-line distance in km between two places or coordinates. */
export function distanceKm(
  a: { lat: number | null; lng: number | null },
  b: { lat: number | null; lng: number | null },
): number | null {
  if (a.lat === null || a.lng === null || b.lat === null || b.lng === null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
