import type { PlaceBrief } from "./locality.functions";
import type { WorldEntry } from "./world-data";
import {
  evaluateIndexability,
  hasIndexableProvenance,
  isFreshIndexableRecord,
  type IndexabilityDecision,
} from "./seo-indexability";

export type IndexableLocality = Pick<
  PlaceBrief,
  "id" | "name" | "slug" | "countrySegment" | "blurb"
>;

/**
 * Apply the same factual gate to the records delivered by the locality route.
 * Children are included only when the route's canonical loader includes them;
 * this helper never queries or infers supply itself.
 */
export function evaluateLocalityIndexability(input: {
  place: IndexableLocality;
  entries: WorldEntry[];
  now?: number;
}): IndexabilityDecision {
  const now = input.now ?? Date.now();
  const genuine = input.entries.filter((entry) => entry.demonstration !== true);

  return evaluateIndexability({
    pageKind: "locality",
    published: true,
    placeValid:
      Boolean(input.place.id.trim()) &&
      /^[a-z]{2}$/.test(input.place.countrySegment) &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.place.slug),
    publishedRecordCount: genuine.length,
    demonstrationOnly: input.entries.length > 0 && genuine.length === 0,
    informationComplete: Boolean(
      input.place.name.trim() &&
      (input.place.blurb.trim() ||
        genuine.some((entry) => entry.title.trim() && entry.summary.trim())),
    ),
    recordsFresh: genuine.every((entry) => isFreshIndexableRecord(entry, now)),
    provenancePresent: genuine.every(hasIndexableProvenance),
    // Locality routes always link back to the map and render available hierarchy links.
    internalLinksPresent: true,
    // Records reach this function through the existing published public-read boundary.
    policyAllowed: true,
    minimumPublishedRecords: 3,
  });
}
