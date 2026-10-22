/**
 * Read linked source observations in stable bounded pages.
 *
 * The extra sentinel row distinguishes a complete scan at the configured cap
 * from a truncated scan. Callers must treat overflow as incomplete evidence and
 * fail closed rather than trust whatever subset arrived first.
 */
export const SOURCE_RECORD_SCAN_LIMIT = 5_000;
export const SOURCE_RECORD_SCAN_PAGE_SIZE = 500;

export class SourceRecordScanLimitError extends Error {
  constructor(readonly maximumRows: number) {
    super(`Source lifecycle scan exceeds the ${maximumRows}-row safety cap`);
    this.name = "SourceRecordScanLimitError";
  }
}

export async function readBoundedSourceRecordPages<T>(
  maximumRows: number,
  pageSize: number,
  readPage: (from: number, to: number) => Promise<readonly T[]>,
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
  for (let from = 0; from < sentinelLimit; from += pageSize) {
    const to = Math.min(from + pageSize - 1, sentinelLimit - 1);
    const page = await readPage(from, to);
    const requestedRows = to - from + 1;
    if (page.length > requestedRows) {
      throw new Error("Source-record page exceeded its requested range");
    }
    rows.push(...page);

    if (rows.length > maximumRows) {
      throw new SourceRecordScanLimitError(maximumRows);
    }
    if (page.length < requestedRows) break;
  }
  return rows;
}
