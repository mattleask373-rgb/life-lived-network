export const MAX_OPEN_NEEDS_PLACE_IDS = 400;

/**
 * Public locality queries must fail closed when scope cannot be resolved or
 * exceeds the bounded IN-list supported by the existing public read path.
 */
export function boundedOpenNeedsPlaceScope(placeIds: readonly string[]): string[] {
  const uniqueIds = [...new Set(placeIds)];
  if (uniqueIds.length === 0) {
    throw new Error("The selected place's open-needs scope could not be resolved.");
  }
  if (uniqueIds.length > MAX_OPEN_NEEDS_PLACE_IDS) {
    throw new Error("The selected place's open-needs scope exceeds the safe query bound.");
  }
  return uniqueIds;
}

/** Preserve the exact database count; absent or impossible metadata is unknown, not zero. */
export function exactOpenNeedsCount(count: number | null): number {
  if (count === null || !Number.isSafeInteger(count) || count < 0) {
    throw new Error("An exact open-needs count is unavailable.");
  }
  return count;
}
