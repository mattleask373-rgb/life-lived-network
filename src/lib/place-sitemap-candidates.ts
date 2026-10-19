/**
 * Pure candidate enumeration for dynamic locality/service sitemaps.
 * Only the shared indexability gate can authorize a path.
 */
import { descendantIdsOf, type PlaceIndex } from "./places";
import { evaluateLocalityPage } from "./locality-indexability";
import {
  categoryServiceEntries,
  evaluateServiceLocalityPage,
  serviceLocalityPath,
} from "./service-locality";
import { categoriesPresent } from "./service-taxonomy";
import type { WorldEntry } from "./world-data";

const MAX_ROUTE_LOCALITY_SCOPE = 400;
const ROUTE_ENTRY_LIMIT = 60;

/**
 * Entries are ordered by the canonical world read. A candidate uses the same
 * bounded record view as the locality route. Very wide scopes are excluded
 * because the read layer deliberately drops place filters above 400 descendants.
 */
export function buildGatedPlaceSitemapPaths(
  index: PlaceIndex,
  entries: WorldEntry[],
  now = Date.now(),
): string[] {
  const paths = new Set<string>();

  for (const place of index.places) {
    const placeIds = descendantIdsOf(index, place.id);
    if (placeIds.length > MAX_ROUTE_LOCALITY_SCOPE) continue;

    const countrySegment = (place.country_code || "").toLowerCase();
    const brief = {
      id: place.id,
      name: place.name,
      slug: place.slug,
      countrySegment,
      blurb: place.blurb ?? "",
    };
    const ids = new Set(placeIds);
    const localEntries = entries
      .filter((entry) => Boolean(entry.placeId && ids.has(entry.placeId)))
      .slice(0, ROUTE_ENTRY_LIMIT);

    if (evaluateLocalityPage({ place: brief, entries: localEntries, now }).sitemapEligible) {
      paths.add("/" + countrySegment + "/" + place.slug);
    }

    for (const { category } of categoriesPresent(localEntries)) {
      const matching = categoryServiceEntries(localEntries, category.slug);
      if (!matching.some((entry) => !entry.demonstration)) continue;

      const decision = evaluateServiceLocalityPage({
        place: brief,
        serviceSlug: category.slug,
        entries: localEntries,
        now,
      });
      if (decision.sitemapEligible) {
        paths.add(serviceLocalityPath(brief, category.slug));
      }
    }
  }

  return [...paths].sort();
}
