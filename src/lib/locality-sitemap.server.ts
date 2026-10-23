/**
 * Server-only readers for public locality and service sitemaps.
 *
 * Uses the publishable Supabase client for public place/listing scans. For
 * imported rows, a shared resolver reads only source lifecycle metadata using
 * the same bounded service-authority path as world discovery. No profile data
 * or writes. Source scans fail closed when evidence is incomplete.
 */
import { buildPlaceIndex, type Place } from "./places";
import { rowToEntry, type ListingRow } from "./listings";
import { resolvePublicListingLifecycles } from "./public-listing-lifecycle.server";
import type { WorldEntry } from "./world-data";
import {
  indexableLocalityPaths,
  LOCALITY_SITEMAP_LISTING_SCAN_LIMIT,
  LOCALITY_SITEMAP_PLACE_LIMIT,
  readBoundedSitemapPages,
  SitemapSourceLimitError,
  type PublicListingSitemapRow,
} from "./locality-sitemap";
import { indexableServicePaths } from "./service-sitemap";
import { publicServerClient } from "./supabase-public.server";

const PLACE_SELECT =
  "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";
const QUERY_PAGE_SIZE = 1000;
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

interface PublicSitemapSnapshot {
  index: ReturnType<typeof buildPlaceIndex>;
  rows: ListingRow[];
  orderedRows: PublicListingSitemapRow[];
  entriesById: Map<string, WorldEntry>;
}

let cachedSnapshot: { expiresAt: number; value: PublicSitemapSnapshot } | null = null;
let snapshotInFlight: Promise<PublicSitemapSnapshot> | null = null;

/**
 * The locality and service feeds share the same source snapshot. Reuse it for
 * an hour per warm server instance and deduplicate concurrent crawler requests;
 * CDN caching remains an additional layer, not the only protection.
 */
async function readPublicSitemapSnapshot(): Promise<PublicSitemapSnapshot> {
  if (cachedSnapshot && cachedSnapshot.expiresAt > Date.now()) return cachedSnapshot.value;
  if (snapshotInFlight) return snapshotInFlight;

  snapshotInFlight = loadPublicSitemapSnapshot();
  try {
    const value = await snapshotInFlight;
    cachedSnapshot = { expiresAt: Date.now() + SNAPSHOT_TTL_MS, value };
    return value;
  } finally {
    snapshotInFlight = null;
  }
}

async function loadPublicSitemapSnapshot(): Promise<PublicSitemapSnapshot> {
  const supabase = publicServerClient();
  const places = await readBoundedSitemapPages<Place>(
    LOCALITY_SITEMAP_PLACE_LIMIT,
    QUERY_PAGE_SIZE,
    async (from, to) => {
      const { data, error } = await supabase
        .from("places")
        .select(PLACE_SELECT)
        .order("id", { ascending: true })
        .range(from, to);
      if (error) throw error;
      return (data ?? []) as unknown as Place[];
    },
  );

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
      .or(`starts_at.is.null,starts_at.gte.${settled}`)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, end);

    if (error) throw error;
    const page = (data ?? []) as unknown as (ListingRow & {
      starts_at: string | null;
      created_at: string;
    })[];
    rows.push(...page);
    if (rows.length > LOCALITY_SITEMAP_LISTING_SCAN_LIMIT) {
      throw new SitemapSourceLimitError("Listing scan reached the sitemap source cap");
    }
    if (page.length < end - offset + 1) break;
  }

  const importedIds = rows
    .filter((row) => row.origin === "source" || row.origin === "confirmed")
    .map((row) => row.id);
  const lifecycle = await resolvePublicListingLifecycles(importedIds);
  if (lifecycle.failed) {
    throw new SitemapSourceLimitError(
      "Source lifecycle scan failed or exceeded its configured cap",
    );
  }
  const entriesById = new Map<string, WorldEntry>();
  const orderedRows: PublicListingSitemapRow[] = rows.map((row) => {
    let publiclyEligible = false;

    if (row.origin === "source" || row.origin === "confirmed") {
      const decision = lifecycle.failed ? undefined : lifecycle.decisions.get(row.id);
      if (decision?.eligible && decision.sourceName && decision.sourceUrl) {
        entriesById.set(
          row.id,
          rowToEntry(
            {
              ...row,
              // The freshest linked source observation is the canonical decision,
              // even if a different linked source left a cancellation value behind.
              cancellation: "",
              last_checked_at: decision.lastCheckedAt ?? null,
              data_quality: decision.dataQualityOverride ?? row.data_quality,
            },
            undefined,
            [],
            { sourceName: decision.sourceName, sourceUrl: decision.sourceUrl },
          ),
        );
        publiclyEligible = true;
      }
    } else if (
      (row.origin == null || row.origin === "" || row.origin === "resident") &&
      row.cancellation === ""
    ) {
      entriesById.set(row.id, rowToEntry(row));
      publiclyEligible = true;
    }

    // Unknown origins and failed/incomplete source reads remain raw page slots
    // but cannot count toward a URL's public-entry threshold.
    return {
      id: row.id,
      place_id: row.place_id,
      demonstration: row.demonstration ?? false,
      publiclyEligible,
    };
  });

  return { index, rows, orderedRows, entriesById };
}

/** Empty means a complete, verified scan found no eligible locality pages. */
export async function fetchPublicLocalitySitemapPaths(): Promise<string[]> {
  const snapshot = await readPublicSitemapSnapshot();
  return indexableLocalityPaths(snapshot.index, snapshot.orderedRows, { complete: true });
}

/** Empty means a complete, verified scan found no eligible service pages. */
export async function fetchPublicServiceSitemapPaths(): Promise<string[]> {
  const snapshot = await readPublicSitemapSnapshot();
  return indexableServicePaths(snapshot.index, snapshot.orderedRows, snapshot.entriesById, {
    complete: true,
  });
}
