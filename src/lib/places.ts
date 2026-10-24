/**
 * Places — the geography spine.
 *
 * A place is a real record in a hierarchy (world region → country → region →
 * county/area → city → town → village → neighbourhood), with a slug, real
 * approximate coordinates, a timezone and a currency. Everything the app needs
 * — "near me", locality pages, along a route — hangs off this.
 *
 * Nothing in here is country-specific. The default world is the UK & Ireland
 * because that is where the first trial happens; Portugal, Lisbon and anywhere
 * added later resolve through exactly the same helpers.
 *
 * Coordinates are place-level and approximate by design. Nobody's home address
 * ever becomes a coordinate.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  PLACE_SCAN_LIMIT,
  PLACE_SCAN_PAGE_SIZE,
  readBoundedPlacePages,
} from "./bounded-place-scan";
import { distanceKm } from "./geo-distance";
export { distanceKm };

export type PlaceKind =
  "country" | "region" | "area" | "city" | "town" | "village" | "neighbourhood";

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

/** Legacy pilot default, used when no deployment-specific locality is configured. */
const LEGACY_DEFAULT_PLACE_SLUG = "uk-and-ireland";

/**
 * Normalise the optional build-time default locality.
 * It must resolve to a canonical `places` row before it can be selected;
 * this helper never invents or seeds a place.
 */
export function normaliseConfiguredPlaceSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export const CONFIGURED_DEFAULT_PLACE_SLUG = normaliseConfiguredPlaceSlug(
  import.meta.env["VITE_DEFAULT_PLACE_SLUG"],
);

/** Configurable per deployment; UK/Ireland remains the backwards-compatible default. */
export const DEFAULT_PLACE_SLUG = CONFIGURED_DEFAULT_PLACE_SLUG ?? LEGACY_DEFAULT_PLACE_SLUG;

/** Displayed only when no canonical locality could be resolved. */
export const PLACE_FALLBACK = {
  name: "Choose a supported place",
  region: "",
  blurb:
    "The starting place isn't available yet. Choose a supported place to see what's recorded there.",
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

/** How specific a kind is, smallest number = widest. Useful for sorting. */
export const KIND_ORDER: Record<PlaceKind, number> = {
  region: 1,
  country: 2,
  area: 3,
  city: 4,
  town: 5,
  village: 6,
  neighbourhood: 7,
};

export const KIND_LABEL: Record<PlaceKind, string> = {
  region: "Region",
  country: "Country",
  area: "County or area",
  city: "City",
  town: "Town",
  village: "Village",
  neighbourhood: "Neighbourhood",
};

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

const SELECT = "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";

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

/** The world the app opens on, until someone chooses their own. */
export function fetchDefaultPlace(): Promise<ResolvedPlace | null> {
  return fetchPlaceBySlug(DEFAULT_PLACE_SLUG);
}

/** Every canonical place; never turn a truncated index into a selectable hierarchy. */
export async function fetchPlaces(kinds?: PlaceKind[]): Promise<Place[]> {
  const rows = await readBoundedPlacePages(
    PLACE_SCAN_LIMIT,
    PLACE_SCAN_PAGE_SIZE,
    async (afterId, limit) => {
      let query = supabase
        .from("places")
        .select(SELECT)
        .order("id", { ascending: true })
        .limit(limit);
      if (afterId !== null) query = query.gt("id", afterId);
      if (kinds?.length) query = query.in("kind", kinds);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as PlaceRow[];
    },
  );
  return rows.map(toPlace).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

/**
 * The whole geography, once, cached by the query client.
 *
 * Geography is small, public and slow-changing — a few thousand rows at most —
 * so hierarchy walking happens in memory rather than through a query per hop.
 * Activity is never loaded this way; that stays bounded and server-side.
 */
export function fetchPlaceIndex(): Promise<Place[]> {
  return fetchPlaces();
}

// ---------------------------------------------------------------------------
// Pure hierarchy helpers. Given a list of places, they answer questions about
// it without touching the network, which makes them straightforward to test.
// ---------------------------------------------------------------------------

export interface PlaceIndex {
  places: Place[];
  byId: Map<string, Place>;
  bySlug: Map<string, Place>;
  children: Map<string, Place[]>;
  roots: Place[];
}

export type PlaceHierarchyErrorCode =
  "DUPLICATE_ID" | "DUPLICATE_SLUG" | "MISSING_PARENT" | "CYCLE";

export class PlaceHierarchyError extends Error {
  constructor(readonly code: PlaceHierarchyErrorCode) {
    const messages: Record<PlaceHierarchyErrorCode, string> = {
      DUPLICATE_ID: "The canonical place hierarchy contains a duplicate place ID.",
      DUPLICATE_SLUG: "The canonical place hierarchy contains a duplicate place slug.",
      MISSING_PARENT: "The canonical place hierarchy contains a missing parent reference.",
      CYCLE: "The canonical place hierarchy contains a parent cycle.",
    };
    super(messages[code]);
    this.name = "PlaceHierarchyError";
  }
}

export function buildPlaceIndex(places: Place[]): PlaceIndex {
  const byId = new Map<string, Place>();
  const bySlug = new Map<string, Place>();
  const children = new Map<string, Place[]>();
  const roots: Place[] = [];

  for (const place of places) {
    if (byId.has(place.id)) throw new PlaceHierarchyError("DUPLICATE_ID");
    // The database has a unique index on slug too; never silently overwrite it.
    if (bySlug.has(place.slug)) throw new PlaceHierarchyError("DUPLICATE_SLUG");
    byId.set(place.id, place);
    bySlug.set(place.slug, place);
  }

  // A broken hierarchy must not be normalised into a plausible but incorrect
  // set of roots: locality expansion, breadcrumbs and matching all depend on it.
  for (const place of places) {
    if (place.parent_id !== null && !byId.has(place.parent_id)) {
      throw new PlaceHierarchyError("MISSING_PARENT");
    }
  }

  // Follow parent pointers iteratively to avoid recursion limits on deep trees.
  // Each completed path is marked so a valid chain is only examined once.
  const state = new Map<string, "visiting" | "done">();
  for (const place of places) {
    if (state.get(place.id) === "done") continue;
    const trail: string[] = [];
    let currentId: string | null = place.id;
    while (currentId !== null) {
      const currentState = state.get(currentId);
      if (currentState === "visiting") throw new PlaceHierarchyError("CYCLE");
      if (currentState === "done") break;
      state.set(currentId, "visiting");
      trail.push(currentId);
      currentId = byId.get(currentId)!.parent_id;
    }
    for (const id of trail) state.set(id, "done");
  }

  for (const place of places) {
    if (place.parent_id !== null) {
      const siblings = children.get(place.parent_id) ?? [];
      siblings.push(place);
      children.set(place.parent_id, siblings);
    } else {
      roots.push(place);
    }
  }
  const byName = (a: Place, b: Place) =>
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.name.localeCompare(b.name);
  for (const [key, list] of children) children.set(key, [...list].sort(byName));

  return { places, byId, bySlug, children, roots: [...roots].sort(byName) };
}

export function placeBySlug(index: PlaceIndex, slug: string): Place | null {
  return index.bySlug.get(slug) ?? null;
}

/**
 * Prefer the person's saved locality, then the configured canonical default.
 * Unsupported configured defaults deliberately resolve to null instead of
 * silently switching the user to a different region.
 */
export function resolvePlaceFromIndex(
  index: PlaceIndex | null,
  selectedSlug: string,
  defaultSlug = DEFAULT_PLACE_SLUG,
): Place | null {
  if (!index) return null;
  return index.bySlug.get(selectedSlug) ?? index.bySlug.get(defaultSlug) ?? null;
}

/** Everywhere directly inside a place. */
export function childrenOf(index: PlaceIndex, placeId: string): Place[] {
  return index.children.get(placeId) ?? [];
}

/** The chain upwards, nearest parent first. Cycle-safe. */
export function ancestorsOf(index: PlaceIndex, placeId: string): Place[] {
  const chain: Place[] = [];
  const seen = new Set<string>([placeId]);
  let current = index.byId.get(placeId)?.parent_id ?? null;
  while (current && !seen.has(current)) {
    const parent = index.byId.get(current);
    if (!parent) break;
    chain.push(parent);
    seen.add(parent.id);
    current = parent.parent_id;
  }
  return chain;
}

/** A place and everywhere inside it, at any depth. Cycle-safe. */
export function descendantIdsOf(index: PlaceIndex, placeId: string): string[] {
  const ids: string[] = [];
  const queue: string[] = [placeId];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    for (const child of childrenOf(index, id)) queue.push(child.id);
  }
  return ids;
}

/** Slugs for a place and everywhere inside it. */
export function descendantSlugsOf(index: PlaceIndex, placeId: string): string[] {
  return descendantIdsOf(index, placeId)
    .map((id) => index.byId.get(id)?.slug)
    .filter((slug): slug is string => Boolean(slug));
}

/** True when `placeId` sits inside `ancestorId`, or is it. */
export function isWithin(index: PlaceIndex, placeId: string, ancestorId: string): boolean {
  if (placeId === ancestorId) return true;
  return ancestorsOf(index, placeId).some((p) => p.id === ancestorId);
}

/**
 * "Digbeth, Birmingham, West Midlands" — as much of the chain as is useful.
 * Repeated place names stay unambiguous because the path carries the parents.
 */
export function placePath(index: PlaceIndex, placeId: string, depth = 2): string {
  const place = index.byId.get(placeId);
  if (!place) return "";
  const up = ancestorsOf(index, placeId).slice(0, depth);
  return [place.name, ...up.map((p) => p.name)].join(", ");
}

/** The country a place belongs to, if the chain reaches one. */
export function countryOf(index: PlaceIndex, placeId: string): Place | null {
  const place = index.byId.get(placeId);
  if (place?.kind === "country") return place;
  return ancestorsOf(index, placeId).find((p) => p.kind === "country") ?? null;
}

/** Name search across the whole hierarchy, ordered widest-first then A-Z. */
export function searchPlaces(index: PlaceIndex, query: string, limit = 12): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of index.places) {
    const name = place.name.toLowerCase();
    if (name.startsWith(q)) starts.push(place);
    else if (name.includes(q)) contains.push(place);
  }
  const order = (a: Place, b: Place) =>
    KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.name.localeCompare(b.name);
  return [...starts.sort(order), ...contains.sort(order)].slice(0, limit);
}

/**
 * Split free text such as "gardener Brixton" or "Drake Birmingham" into the
 * place it names and what is left. Only an exact place-name match on whole
 * words counts — never a guess — and the longest name wins, so the user's
 * intent words are kept intact. When that name belongs to more than one place
 * (two Newtowns), `place` is null and every candidate is returned so the person
 * can choose. No match: `place: null`, no candidates, text unchanged.
 */
export function splitPlaceFromQuery(
  index: PlaceIndex,
  text: string,
): { place: Place | null; candidates: Place[]; rest: string } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lower = words.map((w) => w.toLowerCase().replace(/[.,!?]+$/, ""));
  let best: { hits: Place[]; start: number; len: number } | null = null;
  for (let len = Math.min(4, lower.length); len >= 1 && !best; len--) {
    for (let start = 0; start + len <= lower.length; start++) {
      const phrase = lower.slice(start, start + len).join(" ");
      const hits = index.places.filter((p) => p.name.toLowerCase() === phrase);
      if (!hits.length) continue;
      hits.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.id.localeCompare(b.id));
      best = { hits, start, len };
      break;
    }
  }
  if (!best) return { place: null, candidates: [], rest: words.join(" ") };
  const rest = [...words.slice(0, best.start), ...words.slice(best.start + best.len)]
    .join(" ")
    .replace(/\s+(in|near|around|at)$/i, "")
    .trim();
  return {
    place: best.hits.length === 1 ? best.hits[0]! : null,
    candidates: best.hits,
    rest,
  };
}

/** "Lisbon, Portugal" / "Birmingham, West Midlands" — whatever depth we know. */
export function placeLabel(resolved: ResolvedPlace | null | undefined): string {
  if (!resolved) return PLACE_FALLBACK.name;
  return resolved.parent ? `${resolved.place.name}, ${resolved.parent.name}` : resolved.place.name;
}
