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
