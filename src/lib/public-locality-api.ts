import type { LocalityGeography, PlaceBrief } from "./locality.functions";
import type { WorldEntry } from "./world-data";

export interface PublicLocalityPlace extends PlaceBrief {
  path: string;
}

export interface PublicLocalityEntry {
  id: string;
  title: string;
  summary: string;
  kind: string;
  layer: WorldEntry["layer"];
  place: string;
  neighbourhood: string;
  when: string;
  band: WorldEntry["band"];
  minutes: number;
  cost: number;
  currency: string;
  verified: boolean;
  quality: WorldEntry["quality"];
  origin: WorldEntry["origin"];
  social: WorldEntry["social"];
  outdoors: boolean;
  skills: string[];
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  cancellation?: WorldEntry["cancellation"];
  organiser?: string;
  ticketUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  serviceCategory?: string;
  organisation?: string;
  bookingState?: WorldEntry["bookingState"];
  bookingUrl?: string;
  demonstration?: boolean;
}

export interface PublicLocalityPayload {
  apiVersion: "2026-10-08";
  locality: PublicLocalityPlace;
  ancestors: PublicLocalityPlace[];
  children: PublicLocalityPlace[];
  siblings: PublicLocalityPlace[];
  entries: PublicLocalityEntry[];
  meta: {
    entryCount: number;
    indexable: boolean;
    generatedAt: string;
  };
}

export function localityPath(place: Pick<PlaceBrief, "countrySegment" | "slug">): string {
  return `/${place.countrySegment || "gb"}/${place.slug}`;
}

function publicPlace(place: PlaceBrief): PublicLocalityPlace {
  return { ...place, path: localityPath(place) };
}

function publicEntry(entry: WorldEntry): PublicLocalityEntry {
  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    kind: entry.kind,
    layer: entry.layer,
    place: entry.place,
    neighbourhood: entry.neighbourhood,
    when: entry.when,
    band: entry.band,
    minutes: entry.minutes,
    cost: entry.cost,
    currency: entry.currency,
    verified: entry.verified,
    quality: entry.quality,
    origin: entry.origin,
    social: entry.social,
    outdoors: entry.outdoors,
    skills: [...entry.skills],
    ...(entry.startsAt ? { startsAt: entry.startsAt } : {}),
    ...(entry.endsAt ? { endsAt: entry.endsAt } : {}),
    ...(entry.timezone ? { timezone: entry.timezone } : {}),
    ...(entry.cancellation ? { cancellation: entry.cancellation } : {}),
    ...(entry.organiser ? { organiser: entry.organiser } : {}),
    ...(entry.ticketUrl ? { ticketUrl: entry.ticketUrl } : {}),
    ...(entry.sourceName ? { sourceName: entry.sourceName } : {}),
    ...(entry.sourceUrl ? { sourceUrl: entry.sourceUrl } : {}),
    ...(entry.serviceCategory ? { serviceCategory: entry.serviceCategory } : {}),
    ...(entry.organisation ? { organisation: entry.organisation } : {}),
    ...(entry.bookingState ? { bookingState: entry.bookingState } : {}),
    ...(entry.bookingUrl ? { bookingUrl: entry.bookingUrl } : {}),
    ...(entry.demonstration ? { demonstration: true } : {}),
  };
}

export function toPublicLocalityPayload(
  geography: LocalityGeography,
  entries: WorldEntry[],
  generatedAt = new Date().toISOString(),
): PublicLocalityPayload {
  const realEntries = entries.filter((entry) => !entry.demonstration);
  return {
    apiVersion: "2026-10-08",
    locality: publicPlace(geography.place),
    ancestors: geography.ancestors.map(publicPlace),
    children: geography.children.map(publicPlace),
    siblings: geography.siblings.map(publicPlace),
    entries: entries.map(publicEntry),
    meta: {
      entryCount: realEntries.length,
      indexable: realEntries.length >= 3,
      generatedAt,
    },
  };
}
