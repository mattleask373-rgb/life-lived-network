import { DataError } from "./errors";

/** Keep locality IDs under the safe filter budget enforced by the server query. */
export const LOCALITY_FILTER_CAP = 400;

/**
 * Reject an oversized scope instead of omitting the place_id predicate.
 * An unfiltered query can return records from elsewhere and falsely label them
 * as belonging to the selected locality.
 */
export function assertLocalityFilterBounded(placeIds: readonly string[]): void {
  if (placeIds.length > LOCALITY_FILTER_CAP) {
    throw new DataError(
      "INVALID_CONTEXT",
      `Locality filter exceeded the ${LOCALITY_FILTER_CAP}-place limit.`,
    );
  }
}
