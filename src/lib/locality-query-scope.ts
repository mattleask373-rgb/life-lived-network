/**
 * A locality filter must never disappear merely because it is too large.
 * Wide requests fail closed; they are not silently widened to the whole world.
 */
export const LOCALITY_FILTER_CAP = 400;

export type LocalityQueryScope =
  | { kind: "place-ids"; placeIds: string[] }
  | { kind: "exact-place"; placeId: string }
  | { kind: "all" }
  | { kind: "too-wide"; count: number; cap: number };

export function localityQueryScope(
  placeId: string | null | undefined,
  candidateIds: readonly string[],
): LocalityQueryScope {
  const placeIds = [...new Set(candidateIds.map((id) => id.trim()).filter(Boolean))];
  if (placeIds.length > LOCALITY_FILTER_CAP) {
    return { kind: "too-wide", count: placeIds.length, cap: LOCALITY_FILTER_CAP };
  }
  if (placeIds.length) return { kind: "place-ids", placeIds };

  const exactPlaceId = placeId?.trim();
  if (exactPlaceId) return { kind: "exact-place", placeId: exactPlaceId };
  return { kind: "all" };
}
