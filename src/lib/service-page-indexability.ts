import type { PlaceBrief } from "./locality.functions";
import type { ServicePageListings } from "./service-page";
import {
  evaluateIndexability,
  hasIndexableProvenance,
  isFreshIndexableRecord,
  type IndexabilityDecision,
} from "./seo-indexability";

export type IndexableServicePlace = Pick<
  PlaceBrief,
  "id" | "name" | "slug" | "countrySegment" | "blurb"
>;

/**
 * Evaluate the real records rendered by service-page.ts. The route currently
 * considers one genuine listing sufficient; SEO evidence still has to be
 * current, attributable, canonical and meaningful.
 */
export function evaluateServicePageIndexability(input: {
  place: IndexableServicePlace;
  listings: ServicePageListings;
  now?: number;
}): IndexabilityDecision {
  const now = input.now ?? Date.now();
  const { place, listings } = input;
  const genuine = listings.real;

  return evaluateIndexability({
    pageKind: "service",
    published: true,
    placeValid:
      Boolean(place.id.trim()) &&
      /^[a-z]{2}$/.test(place.countrySegment) &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.slug),
    categoryValid: Boolean(listings.category.slug.trim() && listings.category.label.trim()),
    publishedRecordCount: genuine.length,
    demonstrationOnly: listings.demonstration.length > 0 && genuine.length === 0,
    informationComplete: Boolean(
      place.name.trim() &&
      listings.category.label.trim() &&
      genuine.some((entry) => entry.title.trim() && entry.summary.trim()),
    ),
    recordsFresh: genuine.every((entry) => isFreshIndexableRecord(entry, now)),
    provenancePresent: genuine.every(hasIndexableProvenance),
    // The service route links to the place page and renders its category context.
    internalLinksPresent: true,
    policyAllowed: true,
    minimumPublishedRecords: 1,
  });
}
