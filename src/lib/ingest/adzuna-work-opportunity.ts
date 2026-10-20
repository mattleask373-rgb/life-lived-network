/**
 * Conservative bridge from the Adzuna parser's staging record to the reviewed
 * WorkOpportunity contract.
 *
 * This module is deliberately pure. It does not fetch, persist, publish, infer
 * a canonical place, approve source rights, or decide that work is lawful.
 * Adzuna records stay staging-only until independent locality resolution,
 * source-rights approval, jurisdiction review and explicit engagement review.
 *
 * The input interface mirrors the output shape of ingest/adzuna.ts but does not
 * import that module yet: that parser remains in draft PR #186, while this
 * focused bridge is stacked on the contract PR (#174). Type compatibility is
 * checked when the two reviewed slices are integrated.
 */

import { safeUrl } from "./normalise";
import { parseWorkOpportunity, type WorkOpportunity } from "../work-opportunities";

export const ADZUNA_PROVIDER_KEY = "adzuna-jobs" as const;

export interface AdzunaBridgeInput {
  providerKey: string;
  externalId: string;
  title: string;
  summary: string;
  employerName: string | null;
  countryCode: string;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  categoryLabel: string | null;
  categoryTag: string | null;
  contractType: string | null;
  contractTime: string | null;
  sourceUrl: string;
  sourceCreatedAt: string | null;
  compensationEvidence: {
    minimum: number | null;
    maximum: number | null;
    salaryIsPredicted: boolean | null;
    currency: null;
    basis: null;
  };
  reviewRequired: true;
}

/**
 * Only a result from the canonical place resolver may be passed here.
 * Country agreement is checked again so a caller cannot silently attach a job
 * from one country to a place in another country.
 */
export interface CanonicalPlaceResolution {
  placeId: string;
  countryCode: string;
}

export type OpportunityBridgeRejectionReason =
  | "wrong_provider"
  | "missing_identity_title_or_link"
  | "invalid_country_code"
  | "invalid_observed_at"
  | "unsupported_arrangement"
  | "unsafe_source_url"
  | "place_country_mismatch"
  | "invalid_place_resolution"
  | "invalid_compensation_evidence";

export interface StagedExternalOpportunity {
  /** Stable source identity for idempotency; never deduplicate on title alone. */
  identity: {
    providerKey: typeof ADZUNA_PROVIDER_KEY;
    externalId: string;
    idempotencyKey: string;
    sourceName: "Adzuna";
    sourceUrl: string;
    sourceCreatedAt: string | null;
    observedAt: string;
    lastSeenAt: string;
    /** An observed ad timestamp alone does not prove the listing is current. */
    freshness: "unknown";
  };
  listing: {
    title: string;
    summary: string;
    employerName: string | null;
    categoryLabel: string | null;
    categoryTag: string | null;
    contractType: string | null;
    contractTime: string | null;
  };
  locality: {
    countryCode: string;
    providerLocationText: string | null;
    providerCoordinates: { latitude: number; longitude: number } | null;
    resolvedPlaceId: string | null;
    resolution: "resolved" | "unresolved";
  };
  /** Raw API salary evidence is retained but is not public compensation. */
  sourceCompensationEvidence: AdzunaBridgeInput["compensationEvidence"];
  workOpportunity: WorkOpportunity;
  publication: {
    state: "review_required";
    canPublish: false;
    blockers: string[];
  };
}

export type AdzunaOpportunityBridgeResult =
  | { status: "staged"; candidate: StagedExternalOpportunity }
  | { status: "rejected"; reason: OpportunityBridgeRejectionReason };

/** Do not infer duration or arrangement from an employer's title or category. */
function arrangementFor(value: string | null): WorkOpportunity["arrangement"] | null {
  switch (value?.trim().toLowerCase()) {
    case "permanent":
      return "longer_term";
    case "temporary":
      return "short_term";
    case "seasonal":
      return "seasonal";
    default:
      return null;
  }
}

function canonicalInstant(value: string): string | null {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function canonicalObservedInstant(value: string): string | null {
  // The observation time must be a timestamp with an explicit timezone, not a
  // date-only value or a machine-local wall clock.
  if (!/^\\d{4}-\\d{2}-\\d{2}T.*(?:Z|[+-]\\d{2}:\\d{2})$/i.test(value)) return null;
  return canonicalInstant(value);
}

function validCompensationEvidence(value: AdzunaBridgeInput["compensationEvidence"]): boolean {
  if (!value || typeof value !== "object") return false;
  const validAmount = (amount: number | null) =>
    amount === null || (Number.isFinite(amount) && amount > 0);
  if (!validAmount(value.minimum) || !validAmount(value.maximum)) return false;
  if (value.minimum !== null && value.maximum !== null && value.minimum > value.maximum) {
    return false;
  }
  if (value.salaryIsPredicted !== null && typeof value.salaryIsPredicted !== "boolean") {
    return false;
  }
  // This staging contract currently has no verified salary currency or basis.
  return value.currency === null && value.basis === null;
}

/**
 * Convert an Adzuna parser result to a candidate matching the existing
 * WorkOpportunity contract. This function can never return a publishable row.
 */
export function stageAdzunaWorkOpportunity(
  input: AdzunaBridgeInput,
  observedAt: string,
  place: CanonicalPlaceResolution | null = null,
): AdzunaOpportunityBridgeResult {
  if (input.providerKey !== ADZUNA_PROVIDER_KEY) {
    return { status: "rejected", reason: "wrong_provider" };
  }

  if (!input.externalId.trim() || !input.title.trim() || !input.sourceUrl.trim()) {
    return { status: "rejected", reason: "missing_identity_title_or_link" };
  }

  const countryCode = input.countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { status: "rejected", reason: "invalid_country_code" };
  }

  const seenAt = canonicalObservedInstant(observedAt);
  if (!seenAt) return { status: "rejected", reason: "invalid_observed_at" };

  const arrangement = arrangementFor(input.contractType);
  if (!arrangement) return { status: "rejected", reason: "unsupported_arrangement" };

  const sourceUrl = safeUrl(input.sourceUrl);
  if (!sourceUrl) return { status: "rejected", reason: "unsafe_source_url" };

  if (place && !place.placeId.trim()) {
    return { status: "rejected", reason: "invalid_place_resolution" };
  }
  if (place && place.countryCode.trim().toUpperCase() !== countryCode) {
    return { status: "rejected", reason: "place_country_mismatch" };
  }

  if (!validCompensationEvidence(input.compensationEvidence)) {
    return { status: "rejected", reason: "invalid_compensation_evidence" };
  }

  const sourceCreatedAt = input.sourceCreatedAt ? canonicalInstant(input.sourceCreatedAt) : null;

  // Adzuna's salary range does not provide verified currency + pay basis in
  // this parser contract, so it is preserved as source evidence only. The
  // displayed WorkOpportunity deliberately says pay was not stated.
  const workOpportunity = parseWorkOpportunity({
    arrangement,
    engagementKind: "not_stated",
    compensation: { status: "not_stated" },
    accommodation: "not_stated",
    skillRequirements: [],
    hostExpectations: [],
    conditions: [],
    jurisdictionCountryCode: countryCode,
    policyReviewStatus: "review_required",
    publicationStatus: "review_required",
    provenance: {
      kind: "partner_feed",
      sourceName: "Adzuna",
      sourceUrl,
    },
    rightsStatus: "unreviewed",
  });

  const blockers = [
    "engagement_kind_not_confirmed",
    "source_rights_not_approved",
    "jurisdiction_policy_review_required",
    "source_freshness_not_verified",
  ];
  if (!place) blockers.push("canonical_place_not_resolved");

  const providerCoordinates =
    typeof input.latitude === "number" &&
    Number.isFinite(input.latitude) &&
    Math.abs(input.latitude) <= 90 &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.longitude) &&
    Math.abs(input.longitude) <= 180
      ? { latitude: input.latitude, longitude: input.longitude }
      : null;

  return {
    status: "staged",
    candidate: {
      identity: {
        providerKey: ADZUNA_PROVIDER_KEY,
        externalId: input.externalId.trim(),
        idempotencyKey: `${ADZUNA_PROVIDER_KEY}:${input.externalId.trim()}`,
        sourceName: "Adzuna",
        sourceUrl,
        sourceCreatedAt,
        observedAt: seenAt,
        lastSeenAt: seenAt,
        freshness: "unknown",
      },
      listing: {
        title: input.title.trim(),
        summary: input.summary,
        employerName: input.employerName,
        categoryLabel: input.categoryLabel,
        categoryTag: input.categoryTag,
        contractType: input.contractType,
        contractTime: input.contractTime,
      },
      locality: {
        countryCode,
        providerLocationText: input.locationText,
        providerCoordinates,
        resolvedPlaceId: place?.placeId ?? null,
        resolution: place ? "resolved" : "unresolved",
      },
      sourceCompensationEvidence: input.compensationEvidence,
      workOpportunity,
      publication: {
        state: "review_required",
        canPublish: false,
        blockers,
      },
    },
  };
}
