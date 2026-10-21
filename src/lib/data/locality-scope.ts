/**
 * A single PostgREST IN filter should not be built from an unbounded list of
 * descendant locality IDs. Callers must fail closed rather than silently omit
 * the locality predicate when a hierarchy grows beyond this bound.
 */
export const MAX_LOCALITY_FILTER_IDS = 400;

export function isLocalityScopeFilterable(placeIds: readonly string[]): boolean {
  return placeIds.length <= MAX_LOCALITY_FILTER_IDS;
}
