import { DataError } from "./data/errors";

export interface CompleteQueryRowsResult<T> {
  data: T[] | null;
  error: unknown;
  count: number | null;
}

/**
 * A capped or failed query cannot be presented as an honest empty/partial match.
 * Exact counts and array shape are required; an explicit cap failure asks for a
 * narrower locality instead of scoring a silent subset.
 */
export function requireCompleteQueryRows<T>(
  result: CompleteQueryRowsResult<T>,
  resource: string,
  cap?: number,
): T[] {
  if (result.error !== null && result.error !== undefined) {
    throw new DataError("DATA_UNAVAILABLE", `${resource} query failed.`);
  }
  if (!Array.isArray(result.data) || result.count === null) {
    throw new DataError(
      "DATA_UNAVAILABLE",
      `${resource} did not return a complete row collection.`,
    );
  }
  if (cap !== undefined && result.count > cap) {
    throw new DataError("SCOPE_TOO_WIDE", `${resource} exceeded its safe cap of ${cap} rows.`);
  }
  if (result.count !== result.data.length) {
    throw new DataError("DATA_UNAVAILABLE", `${resource} query was capped or inconsistent.`);
  }
  return result.data;
}
