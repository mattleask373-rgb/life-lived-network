import { describe, expect, it } from "vitest";

import {
  hasPublicWorkOpportunity,
  publicWorkOpportunityEntries,
  workOpportunityCoversDate,
  workOpportunityFacts,
} from "./work-opportunity-presentation";
import type { WorldEntry } from "./world-data";
import type { WorkOpportunity } from "./work-opportunities";

const opportunity: WorkOpportunity = {
  arrangement: "short_term",
  engagementKind: "paid_work",
  compensation: { status: "stated_paid", amountCents: 2500, currency: "AUD", basis: "hour" },
  duration: { amount: 4, unit: "hours" },
  startDate: "2026-10-20",
  endDate: "2026-10-21",
  accommodation: "not_stated",
  skillRequirements: ["Cleaning experience"],
  hostExpectations: ["Arrive on time"],
  conditions: ["Bring closed shoes"],
  jurisdictionCountryCode: "AU",
  policyReviewStatus: "approved_by_human",
  publicationStatus: "published",
  provenance: { kind: "owner_declared", sourceName: "Test host" },
  rightsStatus: "cleared",
};

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "work-1",
    layer: "work",
    kind: "work",
    title: "Short-term cleaning",
    place: "Example Place",
    neighbourhood: "Example Place",
    x: 1,
    y: 1,
    when: "Dates stated in opportunity details",
    band: "today",
    minutes: 240,
    cost: 0,
    currency: "AUD",
    summary: "Test record; never used as live inventory.",
    details: [],
    host: "Test host",
    verified: true,
    quality: "verified",
    social: "quiet",
    outdoors: false,
    origin: "resident",
    workOpportunity: opportunity,
    ...overrides,
  };
}

describe("work opportunity presentation", () => {
  it("surfaces explicit pay, duration, dates, accommodation and conditions", () => {
    const facts = workOpportunityFacts(opportunity);
    expect(facts).toContainEqual({ label: "Pay", value: "A$25.00 per hour" });
    expect(facts).toContainEqual({ label: "Duration", value: "4 hours" });
    expect(facts).toContainEqual({ label: "Dates", value: "Starts 2026-10-20 · Ends 2026-10-21" });
    expect(facts).toContainEqual({ label: "Accommodation", value: "Not stated" });
    expect(facts).toContainEqual({ label: "Conditions", value: "Bring closed shoes" });
  });

  it("keeps unknown pay, duration, dates and conditions explicit", () => {
    const facts = workOpportunityFacts({
      ...opportunity,
      compensation: { status: "not_stated" },
      duration: undefined,
      startDate: undefined,
      endDate: undefined,
      conditions: [],
    });
    expect(facts).toContainEqual({ label: "Pay", value: "Pay not stated" });
    expect(facts).toContainEqual({ label: "Duration", value: "Duration not stated" });
    expect(facts).toContainEqual({ label: "Dates", value: "Dates not stated" });
    expect(facts).toContainEqual({ label: "Conditions", value: "Conditions not stated" });
  });

  it("only allows published, human-approved, rights-cleared non-demo records to surface", () => {
    const good = entry();
    const demonstration = entry({ demonstration: true, id: "demo" });
    const expired = entry({ quality: "expired", id: "expired" });
    const cancelled = entry({ cancellation: "cancelled", id: "cancelled" });
    const draft = entry({
      id: "draft",
      workOpportunity: { ...opportunity, publicationStatus: "draft" } as WorkOpportunity,
    });
    expect(hasPublicWorkOpportunity(good)).toBe(true);
    expect(hasPublicWorkOpportunity(demonstration)).toBe(false);
    expect(hasPublicWorkOpportunity(expired)).toBe(false);
    expect(hasPublicWorkOpportunity(cancelled)).toBe(false);
    expect(hasPublicWorkOpportunity(draft)).toBe(false);
    expect(publicWorkOpportunityEntries([good, demonstration, expired, cancelled, draft])).toEqual([
      good,
    ]);
  });

  it("does not infer an active today span from missing date endpoints", () => {
    expect(workOpportunityCoversDate(opportunity, "2026-10-20")).toBe(true);
    expect(workOpportunityCoversDate(opportunity, "2026-10-19")).toBe(false);
    expect(workOpportunityCoversDate({ ...opportunity, endDate: undefined }, "2026-10-20")).toBe(
      false,
    );
    expect(workOpportunityCoversDate(opportunity, "not-a-date")).toBe(false);
  });
});
