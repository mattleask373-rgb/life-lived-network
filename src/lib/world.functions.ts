/**
 * The world, behind the server boundary.
 *
 * The browser never queries the shared world directly any more: it hands over a
 * DiscoveryContext and gets back a page of domain entities. rowToEntry() stays
 * the single normalisation seam, so database shapes never travel upwards, and a
 * future provider adapter can feed the same page without a caller changing.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import {
  decodeCursor,
  encodeCursor,
  pageLimit,
  splitPageWithLookahead,
  type DiscoveryContext,
  type Page,
} from "./data/contract";
import { asDataError, DataError } from "./data/errors";
import { localityQueryScope } from "./locality-query-scope";
import {
  decideSourceLifecycle,
  type SourceLifecycleMetadata,
  type SourceRecordLifecycleInput,
} from "./source-lifecycle-policy";
import { rowToEntry, type ListingRow } from "./listings";
import { assertQueryableGeoBounds } from "./geo-bounds";
import {
  readBoundedSourceRecordPages,
  SOURCE_RECORD_SCAN_LIMIT,
  SOURCE_RECORD_SCAN_PAGE_SIZE,
} from "./source-record-pagination";
import type { SourcePhoto, WorldEntry } from "./world-data";

export const getWorld = createServerFn({ method: "GET" })
  .inputValidator((input: DiscoveryContext | undefined) => {
    const context = input ?? {};
    if (context.bounds !== undefined && context.bounds !== null) {
      assertQueryableGeoBounds(context.bounds);
    }
    return context;
  })
  .handler(async ({ data }): Promise<Page<WorldEntry>> => {
    // Propagate a cancelled viewport RPC to the underlying public-data reads.
    const signal = getRequest().signal;
    const { observe } = await import("./data/observe.server");
    return observe(
      "world.page",
      () => readWorld(data, signal),
      (page) => page.items.length,
    );
  });

async function readWorld(
  context: DiscoveryContext,
  signal: AbortSignal,
): Promise<Page<WorldEntry>> {
  const limit = pageLimit(context.limit);
  const offset = decodeCursor(context.cursor);

  try {
    const { publicServerClient } = await import("./supabase-public.server");
    const { fixturesAllowed } = await import("./data/fixtures-policy.server");
    const supabase = publicServerClient();

    // The hierarchy is expanded here, not in the browser. A nation can contain
    // thousands of localities, and naming them all in the request would make
    // the request itself the bottleneck; the browser only says where it is.
    let insideIds = context.placeIds ?? [];
    let insideSlugs = context.placeSlugs ?? [];
    if (!context.bounds && context.placeId) {
      // Client descendant IDs are display/cache hints, not authoritative query scope.
      // Always rebuild scope from the complete server index so a truncated client index
      // cannot make a globally-wide locality appear to fit beneath the 400-ID filter cap.
      const { loadPlaceIndex } = await import("./place-index.server");
      const { descendantIdsOf } = await import("./places");
      const index = await loadPlaceIndex(supabase);
      if (!index.byId.has(context.placeId)) {
        throw new DataError("NOT_FOUND", "Selected place ID is not present in the canonical hierarchy");
      }
      insideIds = descendantIdsOf(index, context.placeId);
      insideSlugs = insideIds
        .map((id) => index.byId.get(id)?.slug)
        .filter((slug): slug is string => Boolean(slug));
    }

    const localityScope = context.bounds ? null : localityQueryScope(context.placeId, insideIds);
    if (localityScope?.kind === "too-wide") {
      throw new DataError(
        "SCOPE_TOO_WIDE",
        `Selected locality has ${localityScope.count} descendant IDs; the safe filter cap is ${localityScope.cap}.`,
      );
    }

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "published")
      .neq("data_quality", "expired")
      // Things with a real start time come first, soonest first; everything
      // else keeps its existing most-recent-first order.
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + limit)
      .abortSignal(signal);
    // The selected locality and visible map rectangle are different scopes.
    // A viewport takes precedence over place filters so panning can retrieve new
    // records without changing the person's selected discovery locality.
    if (context.bounds) {
      const bounds = context.bounds;
      query = query.gte("lat", bounds.minLat).lte("lat", bounds.maxLat);
      if (bounds.minLng <= bounds.maxLng) {
        query = query.gte("lng", bounds.minLng).lte("lng", bounds.maxLng);
      } else {
        // A wrapped longitude interval crosses the antimeridian. Bounds were
        // validated before reaching this query, so only finite numbers enter OR.
        query = query.or(`lng.gte.${bounds.minLng},lng.lte.${bounds.maxLng}`);
      }
    } else if (localityScope?.kind === "place-ids") {
      query = query.in("place_id", localityScope.placeIds);
    } else if (localityScope?.kind === "exact-place") {
      query = query.eq("place_id", localityScope.placeId);
    }

    // An event that has finished is never upcoming. Anything without a start
    // time is unaffected by time filtering.
    const settled = new Date(Date.now() - 3 * 3600000).toISOString();
    query = query.or(`starts_at.is.null,starts_at.gte.${context.startTime ?? settled}`);
    if (context.endTime) query = query.or(`starts_at.is.null,starts_at.lte.${context.endTime}`);

    const { data: rows, error } = await query;
    if (error) throw error;
    throwIfAborted(signal);

    // Use one sentinel row to distinguish an exactly-full final page from a page with more data.
    // The sentinel is not processed; it becomes the first row of the next offset page.
    const boundedRows = splitPageWithLookahead(rows ?? [], limit);
    const listings = boundedRows.items as unknown as ListingRow[];
    const hasMore = boundedRows.hasMore;
    // One extra query for all creators, never one per listing.
    const names = new Map<string, string>();
    const creatorIds = [
      ...new Set(listings.map((r) => r.creator_id).filter((id): id is string => Boolean(id))),
    ];
    const photos = new Map<string, SourcePhoto[]>();
    if (creatorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", creatorIds)
        .eq("discoverable", true)
        .abortSignal(signal);
      throwIfAborted(signal);
      for (const p of profiles ?? []) {
        if (p.display_name) names.set(p.id, p.display_name);
      }
    }

    if (listings.length) {
      const { data: photoRows, error: photoError } = await supabase
        .from("listing_photos")
        .select("listing_id, image_url, source_url, credit, alt_text, position")
        .in(
          "listing_id",
          listings.map((listing) => listing.id),
        )
        .order("position", { ascending: true })
        .abortSignal(signal);
      throwIfAborted(signal);
      if (photoError) throw photoError;
      for (const photo of photoRows ?? []) {
        const current = photos.get(photo.listing_id) ?? [];
        current.push({
          url: photo.image_url,
          sourceUrl: photo.source_url,
          credit: photo.credit,
          alt: photo.alt_text,
        });
        photos.set(photo.listing_id, current);
      }
    }

    // Source records are authoritative for imported-record eligibility and attribution.
    // A failed/incomplete provenance read never promotes an imported row to a resident post;
    // resident records remain available, and transient source failures degrade freshness rather
    // than erasing historical information.
    const imported = listings.filter((r) => r.origin === "source" || r.origin === "confirmed");
    const sourceRecordsByListing = new Map<string, SourceRecordLifecycleInput[]>();
    const sourceMetadata = new Map<string, SourceLifecycleMetadata>();
    let sourceLifecycleReadFailed = false;

    if (imported.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const listingIds = [...new Set(imported.map((r) => r.id))];
      let sourceRecords: {
        id: string;
        listing_id: string | null;
        source_id: string;
        source_url: string | null;
        source_state: string;
        last_seen_at: string | null;
        source_updated_at: string | null;
      }[] = [];

      try {
        sourceRecords = await readBoundedSourceRecordPages(
          SOURCE_RECORD_SCAN_LIMIT,
          SOURCE_RECORD_SCAN_PAGE_SIZE,
          async (afterId, limit) => {
            let query = supabaseAdmin
              .from("source_records")
              .select(
                "id, listing_id, source_id, source_url, source_state, last_seen_at, source_updated_at",
              )
              .in("listing_id", listingIds)
              .order("id", { ascending: true })
              .limit(limit);
            if (afterId !== null) query = query.gt("id", afterId);
            const { data, error } = await query.abortSignal(signal);
            throwIfAborted(signal);
            if (error) throw error;
            return (data ?? []) as typeof sourceRecords;
          },
        );
      } catch {
        // A failed, capped, or incomplete lifecycle read must never leave an older
        // live observation as the sole evidence for an imported public listing.
        throwIfAborted(signal);
        sourceLifecycleReadFailed = true;
      }

      if (!sourceLifecycleReadFailed) {
        for (const record of sourceRecords) {
          if (!record.listing_id) continue;
          const lifecycleRecord: SourceRecordLifecycleInput = {
            listingId: record.listing_id,
            sourceId: record.source_id,
            sourceUrl: record.source_url ?? "",
            sourceState: record.source_state,
            lastSeenAt: record.last_seen_at ?? null,
            sourceUpdatedAt: record.source_updated_at ?? null,
          };
          const existing = sourceRecordsByListing.get(record.listing_id) ?? [];
          existing.push(lifecycleRecord);
          sourceRecordsByListing.set(record.listing_id, existing);
        }

        const sourceIds = [...new Set(sourceRecords.map((record) => record.source_id))];
        if (sourceIds.length) {
          const { data: sources, error: sourcesError } = await supabaseAdmin
            .from("sources")
            .select("id, name, attribution, status, enabled, refresh_minutes, consecutive_failures")
            .in("id", sourceIds)
            .abortSignal(signal);
          throwIfAborted(signal);

          if (sourcesError) {
            sourceLifecycleReadFailed = true;
          } else {
            for (const source of sources ?? []) {
              sourceMetadata.set(source.id, {
                id: source.id,
                name: source.name,
                attribution: source.attribution ?? "",
                status: source.status,
                enabled: source.enabled,
                refreshMinutes: source.refresh_minutes,
                consecutiveFailures: source.consecutive_failures,
              });
            }
          }
        }
      }
    }

    throwIfAborted(signal);
    const lifecycleNow = Date.now();
    const worldItems: WorldEntry[] = [];

    for (const row of listings) {
      if (row.origin === "source" || row.origin === "confirmed") {
        if (sourceLifecycleReadFailed) continue;

        const decision = decideSourceLifecycle({
          listingId: row.id,
          records: sourceRecordsByListing.get(row.id) ?? [],
          sources: sourceMetadata,
          now: lifecycleNow,
        });
        if (!decision.eligible || !decision.sourceName || !decision.sourceUrl) continue;

        // The listing-level cancellation and last-checked values can reflect a
        // different linked source. Use the freshest eligible source observation.
        worldItems.push(
          rowToEntry(
            {
              ...row,
              cancellation: "",
              last_checked_at: decision.lastCheckedAt ?? null,
              data_quality: decision.dataQualityOverride ?? row.data_quality,
            },
            row.creator_id ? names.get(row.creator_id) : undefined,
            photos.get(row.id) ?? [],
            { sourceName: decision.sourceName, sourceUrl: decision.sourceUrl },
          ),
        );
        continue;
      }

      // Unknown origins are never silently reclassified as resident/community posts.
      if (row.origin != null && row.origin !== "" && row.origin !== "resident") continue;
      // Match the former query contract: only explicitly uncancelled resident rows are shown.
      if (row.cancellation !== "") continue;

      worldItems.push(
        rowToEntry(
          row,
          row.creator_id ? names.get(row.creator_id) : undefined,
          photos.get(row.id) ?? [],
        ),
      );
    }

    // Cursor/pagination follows the raw bounded database window, not filtered item
    // count. Otherwise a page with hidden/withdrawn source rows could stop early.
    const page: Page<WorldEntry> = {
      items: worldItems,
      hasMore,
      nextCursor: hasMore ? encodeCursor(offset + limit) : null,
    };

    // The trial layer, only on the first page, only for the locality being
    // looked at, and only ever labelled as a demonstration. A locality with no
    // trial records stays quiet rather than borrowing someone else's.
    // Production never receives demonstration records, whatever is selected.
    if (offset === 0 && !context.bounds && fixturesAllowed()) {
      const { DEMO_ENTRIES } = await import("./fixtures/world-entries");
      const { demoEntriesFor } = await import("./data/demo-layer");
      const matching = demoEntriesFor(DEMO_ENTRIES, new Set(insideSlugs), true);
      if (matching.length) return { ...page, items: [...page.items, ...matching] };
    }
    throwIfAborted(signal);
    return page;
  } catch (error) {
    // Preserve cancellation as cancellation; it is not a user-facing data failure.
    if (signal.aborted) throw error;
    throw asDataError(error);
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    const error = new Error("The request was aborted.");
    error.name = "AbortError";
    throw signal.reason ?? error;
  }
}
