/**
 * Server-only readers for public locality and service sitemaps.
 *
 * Uses the publishable Supabase client so normal anonymous RLS applies. No
 * service-role authority, user profile data, private listings or writes.
 * Source scans are bounded and fail closed rather than publishing partial URLs.
 */
import { buildPlaceIndex, type Place } from "./places";
import { rowToEntry, type ListingRow } from "./listings";
import {
  indexableLocalityPaths,
  LOCALITY_SITEMAP_LISTING_SCAN_LIMIT,
  LOCALITY_SITEMAP_PLACE_LIMIT,
  type PublicListingSitemapRow,
} from "./locality-sitemap";
import { indexableServicePaths } from "./service-sitemap";
import { publicServerClient } from "./supabase-public.server";

const PLACE_SELECT =
  "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";
const QUERY_PAGE_SIZE = 1000;

interface PublicSitemapSnapshot {
  index: ReturnType<typeof buildPlaceIndex>;
  rows: ListingRow[];
  orderedRows: PublicListingSitemapRow[];
}

async function readPublicSitemapSnapshot(): Promise<PublicSitemapSnapshot | null> {
  const supabase = publicServerClient();
  const { data: placeRows, error: placesError } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .limit(LOCALITY_SITEMAP_PLACE_LIMIT + 1);
  if (placesError) throw placesError;
  const places = (placeRows ?? []) as unknown as Place[];
  if (places.length >= LOCALITY_SITEMAP_PLACE_LIMIT) return null;

  const index = buildPlaceIndex(places);
  const settled = new Date(Date.now() - 3 * 3_600_000).toISOString();
  const rows: ListingRow[] = [];

  // This mirrors getWorld(): same public/current filters, same ordering, and
  // one bounded global stream rather than one query per locality/category.
  for (let offset = 0; offset <= LOCALITY_SITEMAP_LISTING_SCAN_LIMIT; offset += QUERY_PAGE_SIZE) {
    const end = Math.min(offset + QUERY_PAGE_SIZE - 1, LOCALITY_SITEMAP_LISTING_SCAN_LIMIT);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "published")
      .neq("data_quality", "expired")
      .eq("cancellation", "")
      .or(`starts_at.is.null,starts_at.gte.${settled}`)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, end);

    if (error) throw error;
    const page = (data ?? []) as unknown as (ListingRow & {
      starts_at: string | null;
      created_at: string;
    })[];
    rows.push(...page);
    if (rows.length > LOCALITY_SITEMAP_LISTING_SCAN_LIMIT) return null;
    if (page.length < end - offset + 1) break;
  }

  return {
    index,
    rows,
    orderedRows: rows.map((row) => ({
      id: row.id,
      place_id: row.place_id,
      demonstration: row.demonstration ?? false,
    })),
  };
}

/** Empty means a complete, verified scan found no eligible locality pages. */
export async function fetchPublicLocalitySitemapPaths(): Promise<string[]> {
  const snapshot = await readPublicSitemapSnapshot();
  if (!snapshot) return [];
  return indexableLocalityPaths(snapshot.index, snapshot.orderedRows, { complete: true });
}

/** Empty means a complete, verified scan found no eligible service pages. */
export async function fetchPublicServiceSitemapPaths(): Promise<string[]> {
  const snapshot = await readPublicSitemapSnapshot();
  if (!snapshot) return [];
  const entriesById = new Map(snapshot.rows.map((row) => [row.id, rowToEntry(row)]));
  return indexableServicePaths(snapshot.index, snapshot.orderedRows, entriesById, { complete: true });
}
