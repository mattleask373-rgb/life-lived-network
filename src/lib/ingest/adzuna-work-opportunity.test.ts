import { describe, expect, it } from "vitest";

import {
  ADZUNA_PROVIDER_KEY,
  stageAdzunaWorkOpportunity,
  type AdzunaBridgeInput,
} from "./adzuna-work-opportunity";
import { isPublishableWorkOpportunity } from "../work-opportunities";

const BASE: AdzunaBridgeInput = {
  providerKey: ADZUNA_PROVIDER_KEY,
  externalId: "ad-123",
  title: "Gardener",
  summary: "Maintain gardens and outdoor spaces.",
  employerName: "Local Employer",
  countryCode: "GB",
  locationText: "Newtown",
  latitude: 52.2,
  longitude: -3.3,
  categoryLabel: "Trade & Construction Jobs",
  categoryTag: "trade-construction-jobs",
  contractType: "permanent",
  contractTime: "part_time",
  sourceUrl: "https://www.adzuna.co.uk/jobs/land/ad/ad-123",
  sourceCreatedAt: "2026-10-18T10:30:00Z",
  compensationEvidence: {
    minimum: 20000,
    maximum: 24000,
    salaryIsPredicted: false,
    currency: null,
    basis: null,
  },
  reviewRequired: true,
};

const OBSERVED_AT = "2026-10-20T12:00:00Z";

describe("Adzuna -> WorkOpportunity staging bridge", () => {
  it("builds a validated, unpublishable WorkOpportunity candidate with source identity", () => {
    const result = stageAdzunaWorkOpportunity(BASE, OBSERVED_AT);
    expect(result.status).toBe("staged");
    if (result.status !== "staged") return;

    const { candidate } = result;
    expect(candidate.identity).toEqual({
      providerKey: ADZUNA_PROVIDER_KEY,
      externalId: "ad-123",
      idempotencyKey: "adzuna-jobs:ad-123",
      sourceName: "Adzuna",
      sourceUrl: BASE.sourceUrl,
      sourceCreatedAt: "2026-10-18T10:30:00.000Z",
      observedAt: "2026-10-20T12:00:00.000Z",
      lastSeenAt: "2026-10-20T12:00:00.000Z",
      freshness: "unknown",
    });
    expect(candidate.listing.title).toBe("Gardener");
    expect(candidate.listing.employerName).toBe("Local Employer");
    expect(candidate.locality).toEqual({
      countryCode: "GB",
      providerLocationText: "Newtown",
      providerCoordinates: { latitude: 52.2, longitude: -3.3 },
      resolvedPlaceId: null,
      resolution: "unresolved",
    });
    expect(candidate.publication.canPublish).toBe(false);
    expect(candidate.publication.blockers).toContain("canonical_place_not_resolved");
    expect(candidate.workOpportunity.publicationStatus).toBe("review_required");
    expect(candidate.workOpportunity.policyReviewStatus).toBe("review_required");
    expect(candidate.workOpportunity.rightsStatus).toBe("unreviewed");
    expect(candidate.workOpportunity.engagementKind).toBe("not_stated");
    expect(isPublishableWorkOpportunity(candidate.workOpportunity)).toBe(false);
  });

  it("never turns an Adzuna salary range into public/stated pay without currency and basis", () => {
    const result = stageAdzunaWorkOpportunity(BASE, OBSERVED_AT);
    expect(result.status).toBe("staged");
    if (result.status !== "staged") return;

    expect(result.candidate.sourceCompensationEvidence).toEqual(BASE.compensationEvidence);
    expect(result.candidate.workOpportunity.compensation).toEqual({ status: "not_stated" });
    expect(result.candidate.publication.canPublish).toBe(false);
  });

  it("preserves predicted salary as evidence but still does not present it as compensation", () => {
    const input: AdzunaBridgeInput = {
      ...BASE,
      compensationEvidence: { ...BASE.compensationEvidence, salaryIsPredicted: true },
    };
    const result = stageAdzunaWorkOpportunity(input, OBSERVED_AT);
    expect(result.status).toBe("staged");
    if (result.status !== "staged") return;
    expect(result.candidate.sourceCompensationEvidence.salaryIsPredicted).toBe(true);
    expect(result.candidate.workOpportunity.compensation).toEqual({ status: "not_stated" });
  });

  it("maps only explicitly understood contract types and rejects unknown duration semantics", () => {
    expect(
      stageAdzunaWorkOpportunity({ ...BASE, contractType: "permanent" }, OBSERVED_AT).status,
    ).toBe("staged");
    expect(
      stageAdzunaWorkOpportunity({ ...BASE, contractType: "temporary" }, OBSERVED_AT).status,
    ).toBe("staged");
    expect(
      stageAdzunaWorkOpportunity({ ...BASE, contractType: "seasonal" }, OBSERVED_AT).status,
    ).toBe("staged");
    expect(stageAdzunaWorkOpportunity({ ...BASE, contractType: "unknown" }, OBSERVED_AT)).toEqual({
      status: "rejected",
      reason: "unsupported_arrangement",
    });
    expect(stageAdzunaWorkOpportunity({ ...BASE, contractType: null }, OBSERVED_AT)).toEqual({
      status: "rejected",
      reason: "unsupported_arrangement",
    });
  });

  it("rejects wrong provider, missing identity, invalid country, unsafe URL and invalid observation time", () => {
    expect(
      stageAdzunaWorkOpportunity({ ...BASE, providerKey: "some-other-source" }, OBSERVED_AT),
    ).toEqual({ status: "rejected", reason: "wrong_provider" });

    expect(stageAdzunaWorkOpportunity({ ...BASE, externalId: " " }, OBSERVED_AT)).toEqual({
      status: "rejected",
      reason: "missing_identity_title_or_link",
    });

    expect(stageAdzunaWorkOpportunity({ ...BASE, countryCode: "GBR" }, OBSERVED_AT)).toEqual({
      status: "rejected",
      reason: "invalid_country_code",
    });

    expect(
      stageAdzunaWorkOpportunity({ ...BASE, sourceUrl: "javascript:alert(1)" }, OBSERVED_AT),
    ).toEqual({ status: "rejected", reason: "unsafe_source_url" });

    expect(stageAdzunaWorkOpportunity(BASE, "not-a-date")).toEqual({
      status: "rejected",
      reason: "invalid_observed_at",
    });
  });

  it("does not attach a canonical place from another country", () => {
    expect(
      stageAdzunaWorkOpportunity(BASE, OBSERVED_AT, {
        placeId: "some-place",
        countryCode: "AU",
      }),
    ).toEqual({ status: "rejected", reason: "place_country_mismatch" });
  });

  it("accepts a canonical resolver result but keeps review/publication gates closed", () => {
    const result = stageAdzunaWorkOpportunity(BASE, OBSERVED_AT, {
      placeId: "canonical-newtown-id",
      countryCode: "GB",
    });
    expect(result.status).toBe("staged");
    if (result.status !== "staged") return;

    expect(result.candidate.locality.resolvedPlaceId).toBe("canonical-newtown-id");
    expect(result.candidate.locality.resolution).toBe("resolved");
    expect(result.candidate.publication.canPublish).toBe(false);
    expect(result.candidate.publication.blockers).not.toContain("canonical_place_not_resolved");
    expect(result.candidate.publication.blockers).toContain("source_rights_not_approved");
  });

  it("rejects impossible source compensation evidence", () => {
    const result = stageAdzunaWorkOpportunity(
      {
        ...BASE,
        compensationEvidence: {
          ...BASE.compensationEvidence,
          minimum: 30000,
          maximum: 20000,
        },
      },
      OBSERVED_AT,
    );
    expect(result).toEqual({
      status: "rejected",
      reason: "invalid_compensation_evidence",
    });
  });
});
