import { describe, expect, it } from "vitest";

import { isPublishableWorkOpportunity, parseWorkOpportunity } from "./work-opportunities";

function opportunity(overrides: Record<string, unknown> = {}) {
  return {
    arrangement: "short_term",
    engagementKind: "paid_work",
    compensation: {
      status: "stated_paid",
      amountMinorUnits: 3250,
      currency: "AUD",
      basis: "hour",
    },
    duration: { amount: 4, unit: "hours" },
    startDate: "2026-11-03",
    endDate: "2026-11-03",
    accommodation: "not_stated",
    transportNotes: "Transport details have not been confirmed.",
    skillRequirements: ["Prior kitchen experience, as stated by the host"],
    hostExpectations: ["Confirm the shift before travelling"],
    conditions: ["Conditions are subject to written agreement"],
    jurisdictionCountryCode: "AU",
    policyReviewStatus: "approved_by_human",
    publicationStatus: "published",
    provenance: { kind: "owner_declared", sourceName: "Opportunity owner" },
    rightsStatus: "cleared",
    ...overrides,
  };
}

describe("work opportunity contract", () => {
  it("keeps pay as integer minor units plus explicit currency and basis", () => {
    const parsed = parseWorkOpportunity(opportunity());
    expect(parsed.compensation).toEqual({
      status: "stated_paid",
      amountMinorUnits: 3250,
      currency: "AUD",
      basis: "hour",
    });
  });

  it("rejects fractional, zero, and negative stated pay", () => {
    for (const amountMinorUnits of [12.5, 0, -100]) {
      expect(() =>
        parseWorkOpportunity(
          opportunity({
            compensation: {
              status: "stated_paid",
              amountMinorUnits,
              currency: "AUD",
              basis: "hour",
            },
          }),
        ),
      ).toThrow();
    }
  });

  it("keeps unknown pay distinct from explicitly unpaid work", () => {
    expect(
      parseWorkOpportunity(
        opportunity({
          compensation: { status: "not_stated" },
        }),
      ).compensation,
    ).toEqual({ status: "not_stated" });

    expect(
      parseWorkOpportunity(
        opportunity({
          engagementKind: "volunteering",
          compensation: {
            status: "explicitly_unpaid",
            classification: "volunteering",
          },
        }),
      ).compensation,
    ).toEqual({
      status: "explicitly_unpaid",
      classification: "volunteering",
    });
  });

  it("does not infer volunteering from missing pay", () => {
    const unstated = opportunity({
      engagementKind: "not_stated",
      compensation: { status: "not_stated" },
      publicationStatus: "draft",
      policyReviewStatus: "not_reviewed",
      rightsStatus: "unreviewed",
    });
    expect(parseWorkOpportunity(unstated).engagementKind).toBe("not_stated");
    expect(isPublishableWorkOpportunity(unstated)).toBe(false);
  });

  it("requires human market-policy review and rights clearance before publication", () => {
    expect(() =>
      parseWorkOpportunity(opportunity({ policyReviewStatus: "review_required" })),
    ).toThrow();
    expect(() => parseWorkOpportunity(opportunity({ rightsStatus: "unreviewed" }))).toThrow();
    expect(
      isPublishableWorkOpportunity(
        opportunity({
          policyReviewStatus: "review_required",
          publicationStatus: "review_required",
          rightsStatus: "unreviewed",
        }),
      ),
    ).toBe(false);
  });

  it("rejects reversed dates and invalid calendar dates", () => {
    expect(() =>
      parseWorkOpportunity(
        opportunity({
          startDate: "2026-11-04",
          endDate: "2026-11-03",
        }),
      ),
    ).toThrow();
    expect(() => parseWorkOpportunity(opportunity({ startDate: "2026-02-30" }))).toThrow();
  });

  it("requires a jurisdiction code and a currency-code shape", () => {
    expect(() => parseWorkOpportunity(opportunity({ jurisdictionCountryCode: "AUS" }))).toThrow();
    expect(() =>
      parseWorkOpportunity(
        opportunity({
          compensation: {
            status: "stated_paid",
            amountMinorUnits: 100,
            currency: "AU",
            basis: "hour",
          },
        }),
      ),
    ).toThrow();
  });

  it("rejects unknown fields instead of silently accepting schema drift", () => {
    expect(() => parseWorkOpportunity(opportunity({ assumedAvailability: true }))).toThrow();
  });

  it("only surfaces reviewed and rights-cleared published records", () => {
    expect(isPublishableWorkOpportunity(opportunity())).toBe(true);
    expect(
      isPublishableWorkOpportunity(
        opportunity({
          publicationStatus: "draft",
          policyReviewStatus: "not_reviewed",
          rightsStatus: "unreviewed",
        }),
      ),
    ).toBe(false);
  });
});
