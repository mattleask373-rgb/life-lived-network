/**
 * Deterministic mapping from an outside event's declared locality to the
 * canonical places hierarchy.
 *
 * A venue name, coordinates-only proximity, or the search-radius centre is
 * never sufficient evidence that an event belongs to a locality. We accept an
 * exact canonical slug, or one unique exact locality name within the provider
 * query's country and configured source coverage. Anything else stays
 * unresolved and must not become a public listing.
 */
export interface CanonicalLocality {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  country_code: string;
}

export interface SourceLocalityEvidence {
  /** Explicit canonical-like slug if the source provides one. */
  localitySlug?: string;
  /** The locality/city label declared by the source, not the venue name. */
  neighbourhood?: string;
  /** Optional two-letter country code from the provider's venue record. */
  countryCode?: string;
}

export type LocalityResolutionReason =
  | "INVALID_QUERY_COUNTRY"
  | "INVALID_SOURCE_COUNTRY"
  | "COUNTRY_MISMATCH"
  | "MISSING_LOCALITY"
  | "NO_CANONICAL_MATCH"
  | "AMBIGUOUS_CANONICAL_NAME"
  | "OUTSIDE_SOURCE_SCOPE"
  | "INVALID_SOURCE_SCOPE";

export type SourceLocalityResolution =
  | {
      status: "resolved";
      placeId: string;
      placeSlug: string;
      placeName: string;
      matchedBy: "canonical_slug" | "exact_name_country";
    }
  | {
      status: "unresolved";
      reason: LocalityResolutionReason;
    };

export interface ResolveSourceLocalityInput {
  evidence: SourceLocalityEvidence;
  queryCountryCode: string;
  places: readonly CanonicalLocality[];
  /** Empty means the source has no explicit locality allow-list. */
  sourcePlaceIds?: readonly string[];
}

/** Unicode-aware name folding; punctuation and diacritics do not create false mismatches. */
export function normaliseLocalityLabel(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isWithinPlace(
  placeId: string,
  ancestorId: string,
  byId: ReadonlyMap<string, CanonicalLocality>,
): boolean {
  let currentId: string | null = placeId;
  const seen = new Set<string>();
  while (currentId !== null && !seen.has(currentId)) {
    if (currentId === ancestorId) return true;
    seen.add(currentId);
    currentId = byId.get(currentId)?.parent_id ?? null;
  }
  return false;
}

function belongsToSourceScope(
  place: CanonicalLocality,
  sourcePlaceIds: readonly string[],
  byId: ReadonlyMap<string, CanonicalLocality>,
): boolean {
  if (sourcePlaceIds.length === 0) return true;
  return sourcePlaceIds.some((scopeId) => isWithinPlace(place.id, scopeId, byId));
}

function resolved(
  place: CanonicalLocality,
  matchedBy: "canonical_slug" | "exact_name_country",
): SourceLocalityResolution {
  return {
    status: "resolved",
    placeId: place.id,
    placeSlug: place.slug,
    placeName: place.name,
    matchedBy,
  };
}

export function resolveSourceLocality(
  input: ResolveSourceLocalityInput,
): SourceLocalityResolution {
  const queryCountryCode = input.queryCountryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(queryCountryCode)) {
    return { status: "unresolved", reason: "INVALID_QUERY_COUNTRY" };
  }

  const sourceCountryRaw = input.evidence.countryCode?.trim() ?? "";
  const sourceCountryCode = sourceCountryRaw.toUpperCase();
  if (sourceCountryRaw && !/^[A-Z]{2}$/.test(sourceCountryCode)) {
    return { status: "unresolved", reason: "INVALID_SOURCE_COUNTRY" };
  }
  if (sourceCountryCode && sourceCountryCode !== queryCountryCode) {
    return { status: "unresolved", reason: "COUNTRY_MISMATCH" };
  }

  const byId = new Map(input.places.map((place) => [place.id, place]));
  const bySlug = new Map(input.places.map((place) => [place.slug.toLowerCase(), place]));
  if (input.sourcePlaceIds?.some((id) => !byId.has(id))) {
    return { status: "unresolved", reason: "INVALID_SOURCE_SCOPE" };
  }
  const sourcePlaceIds = input.sourcePlaceIds ?? [];
  const suppliedSlug = input.evidence.localitySlug?.trim().toLowerCase() ?? "";

  if (suppliedSlug) {
    const place = bySlug.get(suppliedSlug);
    if (!place) return { status: "unresolved", reason: "NO_CANONICAL_MATCH" };
    if (place.country_code.trim().toUpperCase() !== queryCountryCode) {
      return { status: "unresolved", reason: "COUNTRY_MISMATCH" };
    }
    if (!belongsToSourceScope(place, sourcePlaceIds, byId)) {
      return { status: "unresolved", reason: "OUTSIDE_SOURCE_SCOPE" };
    }
    return resolved(place, "canonical_slug");
  }

  const label = input.evidence.neighbourhood?.trim() ?? "";
  if (!label) return { status: "unresolved", reason: "MISSING_LOCALITY" };
  const key = normaliseLocalityLabel(label);
  if (!key) return { status: "unresolved", reason: "MISSING_LOCALITY" };

  const sameName = input.places.filter((place) => normaliseLocalityLabel(place.name) === key);
  const sameCountry = sameName.filter(
    (place) => place.country_code.trim().toUpperCase() === queryCountryCode,
  );
  const inScope = sameCountry.filter((place) =>
    belongsToSourceScope(place, sourcePlaceIds, byId),
  );

  if (inScope.length === 1) return resolved(inScope[0]!, "exact_name_country");
  if (inScope.length > 1) {
    return { status: "unresolved", reason: "AMBIGUOUS_CANONICAL_NAME" };
  }
  if (sameCountry.length > 0) {
    return { status: "unresolved", reason: "OUTSIDE_SOURCE_SCOPE" };
  }
  if (sameName.length > 0) return { status: "unresolved", reason: "COUNTRY_MISMATCH" };
  return { status: "unresolved", reason: "NO_CANONICAL_MATCH" };
}
