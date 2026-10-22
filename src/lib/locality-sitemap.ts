/**
 * Pure eligibility logic for locality sitemap URLs.
 *
 * The data supplied here must already be restricted to the same published,
 * non-expired, non-cancelled, current public listing rows as getWorld(), and
 * in the same stable order. The locality route only renders the first 60 rows;
 * this helper mirrors that first-page indexability gate rather than promising
 * that a locality is indexable from records the page itself would not render.
 */
import type { PlaceIndex } from "./places";
import { localityPath } from "./locality-path";

export const LOCALITY_SITEMAP_PLACE_LIMIT = 5000;
export const LOCALITY_SITEMAP_LISTING_SCAN_LIMIT = 20_000;
export const LOCALITY_SITEMAP_PAGE_SIZE = 60;
export const LOCALITY_FILTER_CAP = 400;

export interface PublicListingSitemapRow {
  id: string;
  place_id: string | null;
  demonstration: boolean | null;
}

export interface LocalitySitemapBuildOptions {
  /** False means either bounded source scan may have truncated the real data. */
  complete?: boolean;
}

/**
 * Return canonical locality paths whose rendered page can currently pass its
 * three-real-entry SEO gate. Input rows must be ordered like getWorld():
 * starts_at ascending with nulls last, then created_at descending.
 *
 * The route currently drops its locality filter for a subtree with more than
 * 400 places. To avoid claiming different indexability from the actual page,
 * this mirrors that behaviour by checking the same global first page for such
 * places. That upstream behaviour should be reviewed separately.
 */
export function indexableLocalityPaths(
  index: PlaceIndex,
  orderedRows: PublicListingSitemapRow[],
  options: LocalitySitemapBuildOptions = {},
): string[] {
  if (options.complete === false) return [];
  // loadPlaceIndex has a 5,000-place bound. Never publish a partial view if
  // the bound might have silently truncated the hierarchy.
  if (index.places.length >= LOCALITY_SITEMAP_PLACE_LIMIT) return [];

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

  // Propagate each public listing to its ancestors. Because input rows are
  // already sorted as the real listing query is sorted, the first 60 records
  // stored for a place are exactly the bounded page that the route would read.
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
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const place of index.places) {
    // getLocality resolves by slug, not (country, slug). If a slug collides,
    // only the record returned by that canonical resolver can have a valid URL.
    if (index.bySlug.get(place.slug)?.id !== place.id) continue;
    if (!validSlug.test(place.slug)) continue;

    const code = (place.country_code ?? "").trim().toLowerCase();
    if (code && !/^[a-z]{2}$/.test(code)) continue;

    const firstPage =
      (placeCount.get(place.id) ?? 1) > LOCALITY_FILTER_CAP
        ? globalFirstPage
        : (rowsByPlace.get(place.id) ?? []);
    const realCount = firstPage.filter((row) => row.demonstration !== true).length;
    if (realCount < 3) continue;

    candidates.push(localityPath({ slug: place.slug, countrySegment: code }));
  }

  // Stable order helps crawlers, tests and incident comparisons.
  return [...new Set(candidates)].sort((a, b) => a.localeCompare(b));
}

/** Raised when a public sitemap source reaches its hard record cap. */
export class SitemapSourceLimitError extends Error {
  constructor(message = "Sitemap source reached its configured cap") {
    super(message);
    this.name = "SitemapSourceLimitError";
  }
}

/**
 * Read a bounded source in deterministic pages. A source that reaches the hard
 * cap is not returned as if it were complete; callers must fail closed rather
 * than publish a sitemap based on a truncated hierarchy.
 */
export async function readBoundedSitemapPages<T>(
  sourceLimit: number,
  pageSize: number,
  readPage: (from: number, to: number) => Promise<readonly T[]>,
): Promise<T[]> {
  if (
    !Number.isSafeInteger(sourceLimit) ||
    sourceLimit < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new RangeError("Sitemap page limits must be positive safe integers");
  }

  const rows: T[] = [];
  for (let from = 0; from < sourceLimit; from += pageSize) {
    const to = Math.min(from + pageSize - 1, sourceLimit - 1);
    const page = await readPage(from, to);
    rows.push(...page);

    if (rows.length >= sourceLimit) {
      throw new SitemapSourceLimitError();
    }
    if (page.length < to - from + 1) break;
  }
  return rows;
}
