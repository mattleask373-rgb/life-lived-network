import { DataError } from "./errors";

/**
 * Validate a successful row-collection read before it can influence a public
 * discovery response. An empty array is a verified empty result; a missing
 * collection or query error is not.
 */
export function requireQueryRows<T>(
  rows: T[] | null | undefined,
  error: unknown,
  resource: string,
): T[] {
  if (error != null) throw error;
  if (!Array.isArray(rows)) {
    throw new DataError("DATA_UNAVAILABLE", `${resource} query returned no row collection.`);
  }
  return rows;
}
