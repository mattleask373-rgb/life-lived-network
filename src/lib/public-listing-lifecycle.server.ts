/**
 * Shared imported-listing lifecycle lookup for world discovery and sitemaps.
 *
 * The only authority for imported rows is decideSourceLifecycle(). A failed,
 * over-cap or incomplete provenance read excludes imported rows; it never
 * silently classifies them as resident/community posts.
 */
import {
  decideSourceLifecycle,
  type SourceLifecycleDecision,
  type SourceLifecycleMetadata,
  type SourceRecordLifecycleInput,
} from "./source-lifecycle-policy";
import {
  assertCompleteSourceRecordScan,
  readBoundedSourceRecordPages,
  SOURCE_RECORD_SCAN_LIMIT,
  SOURCE_RECORD_SCAN_PAGE_SIZE,
} from "./source-record-pagination";

const LISTING_ID_BATCH_SIZE = 250;
export const PUBLIC_LISTING_LIFECYCLE_LISTING_LIMIT = 5_000;

interface SourceRecordRow {
  id: string;
  listing_id: string | null;
  source_id: string;
  source_url: string | null;
  source_state: string;
  last_seen_at: string | null;
  source_updated_at: string | null;
}

export interface PublicListingLifecycleResolution {
  /** True means provenance could not be verified; callers must exclude imports. */
  failed: boolean;
  decisions: ReadonlyMap<string, SourceLifecycleDecision>;
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let offset = 0; offset < values.length; offset += size) {
    result.push(values.slice(offset, offset + size));
  }
  return result;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error("The request was aborted.");
    error.name = "AbortError";
    throw signal.reason ?? error;
  }
}

/**
 * Resolve lifecycle decisions for a bounded set of imported listing IDs.
 *
 * Listing IDs and source IDs are chunked to keep request sizes bounded. The
 * total matching source-record count is checked before reading the records,
 * preventing a partial/capped scan from being mistaken for complete evidence.
 */
export async function resolvePublicListingLifecycles(
  listingIds: readonly string[],
  signal?: AbortSignal,
): Promise<PublicListingLifecycleResolution> {
  const uniqueIds = [...new Set(listingIds)];
  if (uniqueIds.length === 0) return { failed: false, decisions: new Map() };
  if (uniqueIds.length > PUBLIC_LISTING_LIFECYCLE_LISTING_LIMIT) {
    return { failed: true, decisions: new Map() };
  }

  try {
    throwIfAborted(signal);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const idChunks = chunks(uniqueIds, LISTING_ID_BATCH_SIZE);

    // Count every bounded partition first. No lifecycle decision is made if
    // any count fails or if the aggregate exceeds the global observation cap.
    const countedChunks: Array<{ ids: string[]; count: number }> = [];
    let totalRecords = 0;
    for (const ids of idChunks) {
      const { count, error } = await supabaseAdmin
        .from("source_records")
        .select("id", { count: "exact", head: true })
        .in("listing_id", ids)
        .abortSignal(signal);
      throwIfAborted(signal);
      if (error) throw error;
      if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
        throw new Error("Exact source-record count is unavailable");
      }
      totalRecords += count;
      if (totalRecords > SOURCE_RECORD_SCAN_LIMIT) {
        return { failed: true, decisions: new Map() };
      }
      countedChunks.push({ ids, count });
    }

    const recordPages = await Promise.all(
      countedChunks.map(async ({ ids, count }) => {
        if (count === 0) return [];
        const scanned = await readBoundedSourceRecordPages<SourceRecordRow>(
          SOURCE_RECORD_SCAN_LIMIT,
          SOURCE_RECORD_SCAN_PAGE_SIZE,
          async (afterId, limit) => {
            let query = supabaseAdmin
              .from("source_records")
              .select(
                "id, listing_id, source_id, source_url, source_state, last_seen_at, source_updated_at",
              )
              .in("listing_id", ids)
              .order("id", { ascending: true })
              .limit(limit);
            if (afterId !== null) query = query.gt("id", afterId);
            const { data, error } = await query.abortSignal(signal);
            throwIfAborted(signal);
            if (error) throw error;
            return (data ?? []) as SourceRecordRow[];
          },
        );
        return assertCompleteSourceRecordScan(scanned, count);
      }),
    );
    const sourceRecords = recordPages.flat();

    const recordsByListing = new Map<string, SourceRecordLifecycleInput[]>();
    for (const row of sourceRecords) {
      if (!row.listing_id) continue;
      const record: SourceRecordLifecycleInput = {
        listingId: row.listing_id,
        sourceId: row.source_id,
        sourceUrl: row.source_url ?? "",
        sourceState: row.source_state,
        lastSeenAt: row.last_seen_at,
        sourceUpdatedAt: row.source_updated_at,
      };
      const group = recordsByListing.get(row.listing_id) ?? [];
      group.push(record);
      recordsByListing.set(row.listing_id, group);
    }

    const sourceIds = [...new Set(sourceRecords.map((record) => record.source_id))];
    const sourceChunks = chunks(sourceIds, LISTING_ID_BATCH_SIZE);
    const sourceResults = await Promise.all(
      sourceChunks.map(async (ids) => {
        const { data, error } = await supabaseAdmin
          .from("sources")
          .select("id, name, attribution, status, enabled, refresh_minutes, consecutive_failures")
          .in("id", ids)
          .abortSignal(signal);
        throwIfAborted(signal);
        if (error) throw error;
        return data ?? [];
      }),
    );

    const sources = new Map<string, SourceLifecycleMetadata>();
    for (const source of sourceResults.flat()) {
      sources.set(source.id, {
        id: source.id,
        name: source.name,
        attribution: source.attribution ?? "",
        status: source.status,
        enabled: source.enabled,
        refreshMinutes: source.refresh_minutes,
        consecutiveFailures: source.consecutive_failures,
      });
    }

    const now = Date.now();
    const decisions = new Map<string, SourceLifecycleDecision>();
    for (const listingId of uniqueIds) {
      decisions.set(
        listingId,
        decideSourceLifecycle({
          listingId,
          records: recordsByListing.get(listingId) ?? [],
          sources,
          now,
        }),
      );
    }
    throwIfAborted(signal);
    return { failed: false, decisions };
  } catch (error) {
    throwIfAborted(signal);
    // Deliberately expose failure separately from an eligible=false decision.
    // Callers can keep resident rows while excluding every imported row.
    return { failed: true, decisions: new Map() };
  }
}
