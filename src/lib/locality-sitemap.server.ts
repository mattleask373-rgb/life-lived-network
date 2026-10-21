/**
 * Server-only reader for the public locality sitemap.
 *
 * Uses the publishable Supabase client so normal anonymous RLS applies. No
 * service-role authority, user profile data, private listings or write access
 * is involved. If the source scan exceeds its explicit cap, fail closed and
 * publish no locality URLs rather than an incomplete or misleading sitemap.
 */
import { buildPlaceIndex, type Place } from "./places";
import {
  indexableLocalityPaths,
  LOCALITY_SITEMAP_LISTING_SCAN_LIMIT,
  LOCALITY_SITEMAP_PLACE_LIMIT,
  type PublicListingSitemapRow,
} from "./locality-sitemap";
import { publicServerClient } from "./supabase-public.server";

const PLACE_SELECT =
  "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";
const LISTING_SELECT = "place_id, starts_at, created_at, data_quality, status, cancellation, demonstration";
const QUERY_PAGE_SIZE = 1000;

export async function fetchPublicLocalitySitemapPaths(): Promise<string[]> {
  const supabase = publicServerClient();

  const { data: placeRows, error: placesError } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .limit(LOCALITY_SITEMAP_PLACE_LIMIT + 1);
  if (placesError) throw placesError;
  const places = (placeRows ?? []) as unknown as Place[];
  if (places.length >= LOCALITY_SITEMAP_PLACE_LIMIT) return [];

  const index = buildPlaceIndex(places);
  const settled = new Date(Date.now() - 3 * 3_600_000).toISOString();
  const rows: PublicListingSitemapRow[] = [];

  // Fetch one bounded, globally ordered stream and propagate records through
  // the canonical hierarchy in memory. This avoids one query per locality.
  // One sentinel row beyond the cap detects truncation.
  for (
    let offset = 0;
    offset <= LOCALITY_SITEMAP_LISTING_SCAN_LIMIT;
    offset += QUERY_PAGE_SIZE
  ) {
    const end = Math.min(offset + QUERY_PAGE_SIZE - 1, LOCALITY_SITEMAP_LISTING_SCAN_LIMIT);
    const { data, error } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "published")
      .neq("data_quality", "expired")
      .eq("cancellation", "")
      .or(`starts_at.is.null,starts_at.gte.${settled}`)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, end);

    if (error) throw error;
    const page = (data ?? []) as unknown as (PublicListingSitemapRow & {
      starts_at: string | null;
      created_at: string;
    })[];
    rows.push(...page);

    if (rows.length > LOCALITY_SITEMAP_LISTING_SCAN_LIMIT) return [];
    if (page.length < end - offset + 1) break;
  }

  return indexableLocalityPaths(index, rows, { complete: true });
}
