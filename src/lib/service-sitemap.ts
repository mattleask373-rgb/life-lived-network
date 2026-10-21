import type { PlaceIndex } from "./places";
import { categoriesOf } from "./service-taxonomy";
import { isService } from "./services";
import { servicePagePath } from "./service-page";
import type { WorldEntry } from "./world-data";
import {
  LOCALITY_FILTER_CAP,
  LOCALITY_SITEMAP_PAGE_SIZE,
  LOCALITY_SITEMAP_PLACE_LIMIT,
  type PublicListingSitemapRow,
} from "./locality-sitemap";

function eligiblePlace(index: PlaceIndex, place: PlaceIndex["places"][number]) {
  if (index.bySlug.get(place.slug)?.id !== place.id) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.slug)) return null;
  const countrySegment = (place.country_code ?? "").trim().toLowerCase();
  if (countrySegment && !/^[a-z]{2}$/.test(countrySegment)) return null;
  return { slug: place.slug, countrySegment };
}

/**
 * Service sitemap eligibility mirrors the actual service page pipeline: the
 * same first 60 public rows, rowToEntry normalisation, servicePageListings,
 * and servicePageIndexable gate. Demo-only and expired supply never qualifies.
 */
export function indexableServicePaths(
  index: PlaceIndex,
  orderedRows: PublicListingSitemapRow[],
  entriesById: Map<string, WorldEntry>,
  options: { complete?: boolean } = {},
): string[] {
  if (options.complete === false || index.places.length >= LOCALITY_SITEMAP_PLACE_LIMIT) return [];

  const placeCount = new Map<string, number>(index.places.map((place) => [place.id, 1]));
  for (const place of index.places) {
    let parentId = place.parent_id;
    const seen = new Set<string>([place.id]);
    while (parentId && !seen.has(parentId)) {
      const parent = index.byId.get(parentId);
      if (!parent) break;
      seen.add(parent.id);
      placeCount.set(parent.id, (placeCount.get(parent.id) ?? 1) + 1);
      parentId = parent.parent_id;
    }
  }

  const rowsByPlace = new Map<string, PublicListingSitemapRow[]>();
  for (const row of orderedRows) {
    if (!row.place_id || !index.byId.has(row.place_id)) continue;
    let currentId: string | null = row.place_id;
    const seen = new Set<string>();
    while (currentId && !seen.has(currentId)) {
      seen.add(currentId);
      const bucket = rowsByPlace.get(currentId) ?? [];
      if (bucket.length < LOCALITY_SITEMAP_PAGE_SIZE) bucket.push(row);
      rowsByPlace.set(currentId, bucket);
      currentId = index.byId.get(currentId)?.parent_id ?? null;
    }
  }

  const globalFirstPage = orderedRows.slice(0, LOCALITY_SITEMAP_PAGE_SIZE);
  const candidates: string[] = [];
  for (const place of index.places) {
    const canonical = eligiblePlace(index, place);
    if (!canonical) continue;
    const pageRows =
      (placeCount.get(place.id) ?? 1) > LOCALITY_FILTER_CAP
        ? globalFirstPage
        : (rowsByPlace.get(place.id) ?? []);
    const entries = pageRows
      .map((row) => entriesById.get(row.id))
      .filter((entry): entry is WorldEntry => entry !== undefined);

    // Match each rendered entry once, then publish only categories with at
    // least one current, genuine service. This is equivalent to the page
    // servicePageListings() + servicePageIndexable() gates without repeating
    // a full taxonomy scan for every category on every locality.
    const eligibleCategories = new Map<string, (typeof entries)[number]>();
    for (const entry of entries) {
      if (entry.demonstration || entry.quality === "expired" || entry.cancellation || !isService(entry)) {
        continue;
      }
      for (const match of categoriesOf(entry)) {
        eligibleCategories.set(match.category.slug, entry);
      }
    }
    for (const categorySlug of eligibleCategories.keys()) {
      const category = categoriesOf(entries.find((entry) => eligibleCategories.get(categorySlug) === entry)!)[0]?.category;
      if (category) candidates.push(servicePagePath(canonical, category));
    }
  }

  return [...new Set(candidates)].sort((a, b) => a.localeCompare(b));
}
