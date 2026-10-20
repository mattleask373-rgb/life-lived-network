import { describe, expect, it } from "vitest";

import { stageAdzunaWorkOpportunityBatch } from "./adzuna-work-opportunity-adapter";

const GOOD_JOB = {
  id: "fixture-ad-123",
  title: "Gardener",
  description: "Fixture description for the parser-to-bridge test.",
  redirect_url: "https://www.adzuna.co.uk/jobs/details/fixture-ad-123",
  created: "2026-10-18T10:30:00Z",
  company: { display_name: "Fixture Employer" },
  location: {
    display_name: "Fixture locality",
    latitude: 51.5,
    longitude: -0.12,
  },
  category: { label: "Trade & Construction Jobs", tag: "trade-construction-jobs" },
  contract_type: "permanent",
  contract_time: "part_time",
  salary_min: 20000,
  salary_max: 24000,
  salary_is_predicted: false,
};

function payload(results: unknown[]) {
  return { count: results.length, results };
}

const BASE_INPUT = {
  countryCode: "GB",
  observedAt: "2026-10-20T12:00:00Z",
};

describe("Adzuna parser → WorkOpportunity staging composition", () => {
  it("passes parsed source records into the canonical contract and keeps them unpublishable", () => {
    const result = stageAdzunaWorkOpportunityBatch({
      ...BASE_INPUT,
      payload: payload([GOOD_JOB]),
    });

    expect(result.skipped).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.identity).toMatchObject({
      providerKey: "adzuna-jobs",
      externalId: "fixture-ad-123",
      idempotencyKey: "adzuna-jobs:fixture-ad-123",
      sourceName: "Adzuna",
      sourceCreatedAt: "2026-10-18T10:30:00.000Z",
      freshness: "unknown",
    });
    expect(result.candidates[0]?.workOpportunity.compensation).toEqual({
      status: "not_stated",
    });
    expect(result.candidates[0]?.publication.canPublish).toBe(false);
    expect(result.candidates[0]?.publication.blockers).toContain("source_rights_not_approved");
  });

  it("uses only supplied canonical place resolutions and still does not open publication gates", () => {
    const result = stageAdzunaWorkOpportunityBatch({
      ...BASE_INPUT,
      payload: payload([GOOD_JOB]),
      placeResolutions: new Map([
        ["fixture-ad-123", { placeId: "canonical-place-fixture", countryCode: "GB" }],
      ]),
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.locality).toMatchObject({
      resolvedPlaceId: "canonical-place-fixture",
      resolution: "resolved",
    });
    expect(result.candidates[0]?.publication.canPublish).toBe(false);
    expect(result.candidates[0]?.publication.blockers).not.toContain(
      "canonical_place_not_resolved",
    );
    expect(result.candidates[0]?.publication.blockers).toContain("source_rights_not_approved");
  });

  it("reports unknown arrangement semantics as a rejected record, not a guessed mapping", () => {
    const result = stageAdzunaWorkOpportunityBatch({
      ...BASE_INPUT,
      payload: payload([{ ...GOOD_JOB, id: "fixture-unknown", contract_type: "contract" }]),
    });

    expect(result.candidates).toEqual([]);
    expect(result.rejected).toEqual([
      { externalId: "fixture-unknown", reason: "unsupported_arrangement" },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("rejects a resolver result from another country", () => {
    const result = stageAdzunaWorkOpportunityBatch({
      ...BASE_INPUT,
      payload: payload([GOOD_JOB]),
      placeResolutions: new Map([
        ["fixture-ad-123", { placeId: "wrong-country-fixture", countryCode: "AU" }],
      ]),
    });

    expect(result.candidates).toEqual([]);
    expect(result.rejected).toEqual([
      { externalId: "fixture-ad-123", reason: "place_country_mismatch" },
    ]);
  });

  it("keeps provider errors distinguishable from valid zero-result responses", () => {
    const error = stageAdzunaWorkOpportunityBatch({
      ...BASE_INPUT,
      payload: { error: "Invalid API key" },
    });
    expect(error.candidates).toEqual([]);
    expect(error.rejected).toEqual([]);
    expect(error.skipped.join(" ")).toContain("Invalid API key");

    const empty = stageAdzunaWorkOpportunityBatch({
      ...BASE_INPUT,
      payload: payload([]),
    });
    expect(empty).toEqual({ candidates: [], rejected: [], skipped: [] });
  });
});
