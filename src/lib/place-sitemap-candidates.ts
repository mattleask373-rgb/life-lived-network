/**
 * Pure candidate enumeration for dynamic locality/service sitemaps.
 * Only the shared indexability gate can authorize a path.
 */
import type { PlaceIndex } from "./places";
import { evaluateLocalityPage } from "./locality-indexability";
import {
  categoryServiceEntries,
  evaluateServiceLocalityPage,
  serviceLocalityPath,
} from "./service-locality";
import { categoriesPresent } from "./service-taxonomy";
import type { WorldEntry } from "./world-data";

const ROUTE_ENTRY_LIMIT = 60;

/**
 * Entries come from the canonical public world read. Match the same exact-place
 * scope and bound as the rendered locality route; child records belong to their
 * own URL and must not accidentally make an empty parent indexable.
 */
export function buildGatedPlaceSitemapPaths(
  index: PlaceIndex,
  entries: WorldEntry[],
  now = Date.now(),
): string[] {
  const paths = new Set<string>();

  for (const place of index.places) {
    const countrySegment = (place.country_code || "").toLowerCase();
    const brief = {
      id: place.id,
      name: place.name,
      slug: place.slug,
      countrySegment,
      blurb: place.blurb ?? "",
    };
    const localEntries = entries
      .filter((entry) => entry.placeId === place.id)
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
