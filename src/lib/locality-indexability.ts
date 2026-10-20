/**
 * Pure locality-page evidence, shared by route metadata and sitemap generation.
 * Consumes canonical public records; it never fetches data or infers local supply.
 */
import { evaluateIndexability, type IndexabilityDecision } from "./seo-indexability";
import type { PlaceBrief } from "./locality.functions";
import type { WorldEntry } from "./world-data";

export type LocalityIndexabilityPlace = Pick<
  PlaceBrief,
  "id" | "name" | "slug" | "countrySegment" | "blurb"
>;

function recordIsFresh(entry: WorldEntry, now: number): boolean {
  if (
    entry.quality === "expired" ||
    entry.quality === "may have changed" ||
    Boolean(entry.cancellation)
  ) {
    return false;
  }

  const startsAt = entry.startsAt ? Date.parse(entry.startsAt) : undefined;
  const endsAt = entry.endsAt ? Date.parse(entry.endsAt) : undefined;
  if (startsAt !== undefined && !Number.isFinite(startsAt)) return false;
  if (endsAt !== undefined && !Number.isFinite(endsAt)) return false;
  const expiry = endsAt ?? startsAt;
  return expiry === undefined || expiry >= now;
}

function recordHasProvenance(entry: WorldEntry): boolean {
  if (entry.origin === "resident") return true;
  return (
    (entry.origin === "source" || entry.origin === "confirmed") &&
    Boolean(entry.sourceName?.trim() && entry.sourceUrl?.trim())
  );
}

/** Only a fully INDEXABLE locality is eligible to appear in a sitemap. */
export function evaluateLocalityPage(input: {
  place: LocalityIndexabilityPlace;
  entries: WorldEntry[];
  now?: number;
}): IndexabilityDecision {
  const { place, entries } = input;
  const now = input.now ?? Date.now();
  const genuine = entries.filter((entry) => !entry.demonstration);

  return evaluateIndexability({
    pageKind: "locality",
    published: true,
    placeValid:
      Boolean(place.id.trim()) &&
      /^[a-z]{2}$/.test(place.countrySegment) &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.slug),
    publishedRecordCount: genuine.length,
    demonstrationOnly: entries.length > 0 && genuine.length === 0,
    informationComplete: Boolean(place.name.trim() && place.blurb.trim()),
    recordsFresh: genuine.every((entry) => recordIsFresh(entry, now)),
    provenancePresent: genuine.every(recordHasProvenance),
    internalLinksPresent: true,
    policyAllowed: true,
  });
}
