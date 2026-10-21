import { describe, expect, it } from "vitest";

import {
  hasPublicWorkOpportunity,
  workOpportunityFacts,
} from "./work-opportunity-presentation";
import type { WorldEntry } from "./world-data";
import type { WorkOpportunity } from "./work-opportunities";

const opportunity: WorkOpportunity = {
  arrangement: "short_term",
  engagementKind: "paid_work",
  compensation: { status: "stated_paid", amountMinorUnits: 2500, currency: "AUD", basis: "hour" },
  duration: { amount: 4, unit: "hours" },
  startDate: "2026-11-03",
  endDate: "2026-11-03",
  accommodation: "not_stated",
  skillRequirements: ["Cleaning experience"],
  hostExpectations: ["Confirm the shift before travelling"],
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
  it("renders stated pay and conditions without inferring missing details", () => {
    const facts = workOpportunityFacts(opportunity);
    expect(facts.find((fact) => fact.label === "Pay")?.value).toContain("25.00");
    expect(facts).toContainEqual({ label: "Duration", value: "4 hours" });
    expect(facts).toContainEqual({ label: "Dates", value: "Starts 2026-11-03 · Ends 2026-11-03" });
    expect(facts).toContainEqual({ label: "Accommodation", value: "Not stated" });
    expect(facts).toContainEqual({ label: "Conditions", value: "Bring closed shoes" });
  });

  it("formats currencies with zero decimal minor units correctly", () => {
    const facts = workOpportunityFacts({
      ...opportunity,
      compensation: { status: "stated_paid", amountMinorUnits: 2500, currency: "JPY", basis: "hour" },
    });
    const pay = facts.find((fact) => fact.label === "Pay")?.value ?? "";
    expect(pay).toContain("2,500");
    expect(pay).not.toContain(".00");
  });

  it("only presents work on eligible, non-demo, non-expired, non-cancelled records", () => {
    expect(hasPublicWorkOpportunity(entry())).toBe(true);
    expect(hasPublicWorkOpportunity(entry({ demonstration: true }))).toBe(false);
    expect(hasPublicWorkOpportunity(entry({ quality: "expired" }))).toBe(false);
    expect(hasPublicWorkOpportunity(entry({ quality: "may have changed" }))).toBe(false);
    expect(hasPublicWorkOpportunity(entry({ cancellation: "cancelled" }))).toBe(false);
    expect(hasPublicWorkOpportunity(entry({ layer: "experience" }))).toBe(false);
    expect(
      hasPublicWorkOpportunity(
        entry({ workOpportunity: { ...opportunity, publicationStatus: "draft" } as WorkOpportunity }),
      ),
    ).toBe(false);
    expect(
      hasPublicWorkOpportunity(
        entry({ workOpportunity: { ...opportunity, rightsStatus: "restricted" } as WorkOpportunity }),
      ),
    ).toBe(false);
  });
});
