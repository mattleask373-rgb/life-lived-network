/**
 * Bounded query planning for the personal-opportunities view.
 *
 * Every need query keeps a server-side locality predicate. Broad scopes are
 * split into bounded place-ID chunks; we never drop the predicate and sample
 * the global feed. Each chunk reads the same newest-first top-N window, then
 * the caller merges those windows deterministically before running the one
 * canonical reciprocal matcher.
 */
export const OPPORTUNITY_PLACE_CHUNK_SIZE = 400;
export const MAX_OPPORTUNITY_PLACE_IDS = 5_000;
export const OPPORTUNITY_CANDIDATES_PER_CHUNK = 60;

export class OpportunityScopeTooWideError extends Error {
  constructor(
    readonly placeCount: number,
    readonly maximumPlaces: number = MAX_OPPORTUNITY_PLACE_IDS,
  ) {
    super(
      `Opportunity locality covers ${placeCount} places; the safe per-request cap is ${maximumPlaces}. Choose a narrower area.`,
    );
    this.name = "OpportunityScopeTooWideError";
  }
}

/** Deduplicate IDs, enforce a total work bound, and split without losing IDs. */
export function chunkOpportunityPlaceIds(
  placeIds: readonly string[],
  chunkSize = OPPORTUNITY_PLACE_CHUNK_SIZE,
  maximumPlaces = MAX_OPPORTUNITY_PLACE_IDS,
): string[][] {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError("Opportunity place chunk size must be a positive safe integer");
  }
  if (!Number.isSafeInteger(maximumPlaces) || maximumPlaces < 1) {
    throw new RangeError("Opportunity place cap must be a positive safe integer");
  }

  const unique = [...new Set(placeIds)];
  if (unique.length > maximumPlaces) {
    throw new OpportunityScopeTooWideError(unique.length, maximumPlaces);
  }

  const chunks: string[][] = [];
  for (let offset = 0; offset < unique.length; offset += chunkSize) {
    chunks.push(unique.slice(offset, offset + chunkSize));
  }
  return chunks;
}

export interface BoundedOpportunityPage<T> {
  /** The newest rows retained for matching; the sentinel row is never returned. */
  rows: T[];
  /** True when at least one additional row exists outside the retained window. */
  truncated: boolean;
}

/**
 * Keep a bounded page while preserving whether the query hit its cap.
 * Callers must ask the database for limit + 1 rows so exact-cap and over-cap
 * results can be distinguished. Missing data is a failed read, never empty.
 */
export function boundOpportunityPage<T>(
  rows: readonly T[] | null | undefined,
  maximumRows = OPPORTUNITY_CANDIDATES_PER_CHUNK,
): BoundedOpportunityPage<T> {
  if (!Array.isArray(rows)) {
    throw new Error("Opportunity candidate read returned no row collection");
  }
  if (!Number.isSafeInteger(maximumRows) || maximumRows < 1) {
    throw new RangeError("Opportunity candidate window must be a positive safe integer");
  }
  return {
    rows: rows.slice(0, maximumRows),
    truncated: rows.length > maximumRows,
  };
}

/**
 * Merge per-place-chunk top-N windows. Since a need belongs to one place ID,
 * reading N rows per chunk is sufficient to calculate the global newest N:
 * a row ranked below N inside its own chunk cannot rank in the global top N.
 * IDs provide a stable tie-break when timestamps match.
 */
export function mergeNewestNeedRows<T extends { id: string; created_at: string }>(
  pages: readonly (readonly T[])[],
  limit = OPPORTUNITY_CANDIDATES_PER_CHUNK,
): T[] {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new RangeError("Opportunity result limit must be a non-negative safe integer");
  }

  const byId = new Map<string, T>();
  for (const page of pages) {
    for (const row of page) {
      const previous = byId.get(row.id);
      if (!previous || row.created_at.localeCompare(previous.created_at) > 0) {
        byId.set(row.id, row);
      }
    }
  }

  return [...byId.values()]
    .sort(
      (left, right) =>
        right.created_at.localeCompare(left.created_at) || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}
