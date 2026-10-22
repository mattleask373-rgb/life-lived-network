/**
 * Bounded, deterministic keyset scan for the canonical public place hierarchy.
 *
 * Ordering uses immutable UUID IDs, not mutable names. Errors/overflow reject the
 * whole scan; callers must not build a hierarchy from a partial page set.
 * Keyset paging is not a transaction snapshot if place rows are inserted/deleted.
 */
export const PLACE_SCAN_LIMIT = 50_000;
export const PLACE_SCAN_PAGE_SIZE = 1_000;

export class PlaceScanLimitError extends Error {
  constructor(readonly maximumRows: number) {
    super(`Place hierarchy exceeds the ${maximumRows}-row safety cap`);
    this.name = "PlaceScanLimitError";
  }
}

/**
 * Verify the scan matches an exact server-side count. A short HTTP page alone
 * cannot prove completion because PostgREST/proxies may enforce a lower row cap.
 */
export function assertCompletePlaceScan<T>(
  rows: readonly T[],
  expectedCount: number | null,
  maximumRows = PLACE_SCAN_LIMIT,
): T[] {
  if (
    typeof expectedCount !== "number" ||
    !Number.isSafeInteger(expectedCount) ||
    expectedCount < 0
  ) {
    throw new Error("Exact place count is unavailable");
  }
  if (expectedCount > maximumRows) throw new PlaceScanLimitError(maximumRows);
  if (rows.length !== expectedCount) {
    throw new Error(`Place scan incomplete: expected ${expectedCount} rows, received ${rows.length}`);
  }
  return [...rows];
}

export async function readBoundedPlacePages<T extends { id: string }>(
  maximumRows: number,
  pageSize: number,
  readPage: (afterId: string | null, limit: number) => Promise<readonly T[]>,
): Promise<T[]> {
  if (
    !Number.isSafeInteger(maximumRows) ||
    maximumRows < 1 ||
    maximumRows >= Number.MAX_SAFE_INTEGER ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new RangeError("Place scan limits must be positive safe integers");
  }

  const sentinelLimit = maximumRows + 1;
  const rows: T[] = [];
  let afterId: string | null = null;

  while (rows.length < sentinelLimit) {
    const requestedRows = Math.min(pageSize, sentinelLimit - rows.length);
    const page = await readPage(afterId, requestedRows);
    if (page.length > requestedRows) {
      throw new Error("Place page exceeded its requested limit");
    }

    let previousId = afterId;
    for (const row of page) {
      if (typeof row.id !== "string" || row.id.length === 0) {
        throw new Error("Place page contains a missing cursor ID");
      }
      if (previousId !== null && row.id <= previousId) {
        throw new Error("Place page IDs must be strictly increasing");
      }
      previousId = row.id;
    }

    rows.push(...page);
    if (rows.length > maximumRows) throw new PlaceScanLimitError(maximumRows);
    if (page.length < requestedRows) break;
    afterId = page[page.length - 1]!.id;
  }

  return rows;
}
