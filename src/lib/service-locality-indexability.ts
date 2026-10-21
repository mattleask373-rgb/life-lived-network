/**
 * Shared, explainable indexability decision for a service in a locality.
 * The route and sitemap must use this same gate.
 */
import { evaluateIndexability, type IndexabilityDecision } from "./seo-indexability";
import type { PlaceBrief } from "./locality.functions";
import { servicePageListings } from "./service-page";
import type { WorldEntry } from "./world-data";

export type ServiceLocalityIndexabilityPlace = Pick<
  PlaceBrief,
  "id" | "name" | "slug" | "countrySegment" | "blurb"
>;

function recordIsFresh(entry: WorldEntry, now: number): boolean {
  if (entry.quality === "expired" || entry.quality === "may have changed" || entry.cancellation) {
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

/**
 * One real, current listing is the existing service-page threshold. More
 * demanding evidence checks prevent thin, stale or unattributed pages from
 * entering search or a sitemap.
 */
export function evaluateServiceLocalityPage(input: {
  place: ServiceLocalityIndexabilityPlace;
  serviceSlug: string;
  entries: WorldEntry[];
  now?: number;
}): IndexabilityDecision {
  const listings = servicePageListings(input.entries, input.serviceSlug);
  const real = listings?.real ?? [];
  const demonstrations = listings?.demonstration ?? [];
  const place = input.place;
  const now = input.now ?? Date.now();

  return evaluateIndexability({
    pageKind: "service",
    published: true,
    placeValid:
      Boolean(place.id.trim()) &&
      /^[a-z]{2}$/.test(place.countrySegment) &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.slug),
    categoryValid: Boolean(listings),
    publishedRecordCount: real.length,
    demonstrationOnly: real.length === 0 && demonstrations.length > 0,
    informationComplete: Boolean(
      place.name.trim() && place.blurb.trim() && listings?.category.label.trim(),
    ),
    recordsFresh: real.every((entry) => recordIsFresh(entry, now)),
    provenancePresent: real.every(recordHasProvenance),
    internalLinksPresent: true,
    policyAllowed: true,
    minimumPublishedRecords: 1,
  });
}
