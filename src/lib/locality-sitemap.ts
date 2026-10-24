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
  /** Must be explicitly true for a raw row to count as public sitemap evidence. */
  publiclyEligible: boolean;
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
 * The route fails closed for a subtree wider than LOCALITY_FILTER_CAP. The
 * sitemap must not borrow unrelated global rows to index that non-indexable page.
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

  const candidates: string[] = [];
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const place of index.places) {
    // getLocality resolves by slug, not (country, slug). If a slug collides,
    // only the record returned by that canonical resolver can have a valid URL.
    if (index.bySlug.get(place.slug)?.id !== place.id) continue;
    if (!validSlug.test(place.slug)) continue;

    const code = (place.country_code ?? "").trim().toLowerCase();
    if (code && !/^[a-z]{2}$/.test(code)) continue;

    // Locality pages whose canonical query scope is over the cap fail closed.
    // Do not substitute unrelated global rows, which could create a false SEO claim.
    if ((placeCount.get(place.id) ?? 1) > LOCALITY_FILTER_CAP) continue;
    const firstPage = rowsByPlace.get(place.id) ?? [];
    const realCount = firstPage.filter(
      (row) => row.publiclyEligible === true && row.demonstration !== true,
    ).length;
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
/**
 * Page payloads intentionally exclude count values. Count the complete source
 * before and after the scan, then verify every requested range and row ID.
 */
export interface BoundedSitemapPage<T> {
  rows: readonly T[];
}

/**
 * Read a bounded source in deterministic pages. Counts are authoritative
 * completeness evidence; short pages, changed counts, duplicate/missing IDs,
 * and cap hits fail closed instead of publishing a plausible partial sitemap.
 */
export async function readBoundedSitemapPages<T>(
  sourceLimit: number,
  pageSize: number,
  readCount: () => Promise<number | null>,
  readPage: (from: number, to: number) => Promise<BoundedSitemapPage<T>>,
  getId: (row: T) => string,
): Promise<T[]> {
  if (
    !Number.isSafeInteger(sourceLimit) ||
    sourceLimit < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new RangeError("Sitemap page limits must be positive safe integers");
  }

  const initialCount = await readCount();
  if (initialCount === null || !Number.isSafeInteger(initialCount) || initialCount < 0) {
    throw new SitemapSourceLimitError("Sitemap source exact count is missing or invalid");
  }
  if (initialCount >= sourceLimit) {
    throw new SitemapSourceLimitError("Sitemap source reached or exceeded its configured cap");
  }

  const rows: T[] = [];
  const seenIds = new Set<string>();
  for (let from = 0; from < initialCount; from += pageSize) {
    const to = Math.min(from + pageSize - 1, initialCount - 1);
    const page = await readPage(from, to);
    const expectedLength = to - from + 1;
    if (!page || !Array.isArray(page.rows) || page.rows.length !== expectedLength) {
      throw new SitemapSourceLimitError("Sitemap source returned a short or invalid page");
    }

    for (const row of page.rows) {
      const id = getId(row);
      if (typeof id !== "string" || !id.trim() || seenIds.has(id)) {
        throw new SitemapSourceLimitError("Sitemap source contains a missing or duplicate row ID");
      }
      seenIds.add(id);
    }
    rows.push(...page.rows);
  }

  const finalCount = await readCount();
  if (
    finalCount === null ||
    !Number.isSafeInteger(finalCount) ||
    finalCount !== initialCount ||
    rows.length !== initialCount
  ) {
    throw new SitemapSourceLimitError(
      "Sitemap source count changed or did not match the scanned rows",
    );
  }

  return rows;
}
