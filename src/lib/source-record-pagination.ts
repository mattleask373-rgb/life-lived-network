/**
 * Read source observations in stable, bounded keyset pages.
 *
 * source_records.id is an immutable UUID primary key. Use it as the cursor
 * rather than mutable last_seen_at, which can reorder rows between HTTP reads.
 * The cap+1 sentinel detects overflow. Keyset paging avoids offset shifts from
 * updates to sort fields; it does not provide a transaction-wide DB snapshot,
 * so concurrent inserts/deletes may still require a later reconciliation pass.
 */
export const SOURCE_RECORD_SCAN_LIMIT = 5_000;
export const SOURCE_RECORD_SCAN_PAGE_SIZE = 500;

export class SourceRecordScanLimitError extends Error {
  constructor(readonly maximumRows: number) {
    super(`Source lifecycle scan exceeds the ${maximumRows}-row safety cap`);
    this.name = "SourceRecordScanLimitError";
  }
}

export async function readBoundedSourceRecordPages<T extends { id: string }>(
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
    throw new RangeError("Source-record scan limits must be positive safe integers");
  }

  const sentinelLimit = maximumRows + 1;
  const rows: T[] = [];
  let afterId: string | null = null;

  while (rows.length < sentinelLimit) {
    const requestedRows = Math.min(pageSize, sentinelLimit - rows.length);
    const page = await readPage(afterId, requestedRows);

    if (page.length > requestedRows) {
      throw new Error("Source-record page exceeded its requested limit");
    }

    let previousId = afterId;
    for (const row of page) {
      if (typeof row.id !== "string" || row.id.length === 0) {
        throw new Error("Source-record page contains a missing cursor ID");
      }
      if (previousId !== null && row.id <= previousId) {
        throw new Error("Source-record page IDs must be strictly increasing");
      }
      previousId = row.id;
    }

    rows.push(...page);
    if (rows.length > maximumRows) {
      throw new SourceRecordScanLimitError(maximumRows);
    }
    if (page.length < requestedRows) break;

    afterId = page[page.length - 1]!.id;
  }

  return rows;
}
