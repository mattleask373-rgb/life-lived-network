/**
 * Pure candidate enumeration for dynamic locality and service sitemaps.
 * Only the same indexability gates used by route metadata may authorize paths.
 */
import { categoriesPresent } from "./service-taxonomy";
import { evaluateLocalityPage } from "./locality-indexability";
import { evaluateServiceLocalityPage } from "./service-locality-indexability";
import { localityPath } from "./locality-path";
import { servicePageListings, servicePagePath } from "./service-page";
import type { PlaceIndex } from "./places";
import type { WorldEntry } from "./world-data";

const ROUTE_ENTRY_LIMIT = 60;

export interface GatedPlaceSitemapPaths {
  localityPaths: string[];
  servicePaths: string[];
}

/**
 * Entries come from the canonical public world read. Each route uses an exact
 * place scope and the same bounded set as its page loader. Child records never
 * make an otherwise empty parent locality indexable.
 */
export function buildGatedPlaceSitemapPaths(
  index: PlaceIndex,
  entries: WorldEntry[],
  now = Date.now(),
): GatedPlaceSitemapPaths {
  const localities = new Set<string>();
  const services = new Set<string>();

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
      localities.add(localityPath(brief));
    }

    for (const { category } of categoriesPresent(localEntries)) {
      const listings = servicePageListings(localEntries, category.slug);
      if (!listings) continue;
      const decision = evaluateServiceLocalityPage({
        place: brief,
        serviceSlug: category.slug,
        entries: localEntries,
        now,
      });
      if (decision.sitemapEligible) services.add(servicePagePath(brief, category));
    }
  }

  return {
    localityPaths: [...localities].sort(),
    servicePaths: [...services].sort(),
  };
}
