import { describe, expect, it } from "vitest";
import {
  categoryFromSubject,
  priorityFromGap,
  toAcquisitionOpportunity,
  type AcquisitionOpportunityInput,
} from "./acquisition-opportunity";
import type { SupplyGapResult } from "./supply-gap";

function makeGap(
  status: SupplyGapResult["status"],
  overrides: Partial<SupplyGapResult> = {},
): SupplyGapResult {
  return {
    status,
    reason:
      status === "ZERO_SUPPLY"
        ? "Canonical discovery returned zero trustworthy results. This does not prove that no real-world provider exists."
        : status === "WEAK_SUPPLY"
          ? "Canonical discovery returned only weak or related results."
          : status === "SATISFIED"
            ? "Canonical discovery returned strong results."
            : "Locality could not be resolved.",
    strongCount: status === "SATISFIED" ? 2 : 0,
    totalCount: status === "WEAK_SUPPLY" ? 1 : status === "SATISFIED" ? 2 : 0,
    quiet: status === "ZERO_SUPPLY" || status === "UNKNOWN_LOCALITY",
    ...overrides,
  };
}

describe("acquisition-opportunity contract", () => {
  it("derives category conservatively from subject", () => {
    expect(categoryFromSubject("gardener")).toBe("gardener");
    expect(categoryFromSubject("Gardening")).toBe("gardener");
    expect(categoryFromSubject("plumber")).toBe("plumber");
    expect(categoryFromSubject("unknown trade")).toBe("other_local_service");
  });

  it("assigns priority only from gap status", () => {
    expect(priorityFromGap("ZERO_SUPPLY")).toBe("high");
    expect(priorityFromGap("WEAK_SUPPLY")).toBe("medium");
    expect(priorityFromGap("SATISFIED")).toBe("none");
    expect(priorityFromGap("UNKNOWN_LOCALITY")).toBe("none");
  });

  it("returns null for SATISFIED gap (no acquisition needed)", () => {
    const input: AcquisitionOpportunityInput = {
      gap: makeGap("SATISFIED"),
      localityId: "brixton",
      localityName: "Brixton",
      subject: "gardener",
    };
    expect(toAcquisitionOpportunity(input)).toBeNull();
  });

  it("returns null for UNKNOWN_LOCALITY (cannot classify)", () => {
    const input: AcquisitionOpportunityInput = {
      gap: makeGap("UNKNOWN_LOCALITY"),
      localityId: "unknown",
      localityName: "Unknown",
      subject: "gardener",
    };
    expect(toAcquisitionOpportunity(input)).toBeNull();
  });

  it("produces a high-priority opportunity for ZERO_SUPPLY", () => {
    const input: AcquisitionOpportunityInput = {
      gap: makeGap("ZERO_SUPPLY"),
      localityId: "brixton",
      localityName: "Brixton",
      subject: "gardener",
      now: "2026-10-06T18:00:00Z",
    };
    const opp = toAcquisitionOpportunity(input);
    expect(opp).not.toBeNull();
    expect(opp!.id).toBe("acq:brixton:gardener");
    expect(opp!.localityId).toBe("brixton");
    expect(opp!.category).toBe("gardener");
    expect(opp!.gapStatus).toBe("ZERO_SUPPLY");
    expect(opp!.priority).toBe("high");
    expect(opp!.actionable).toBe(true);
    expect(opp!.requiredEvidence.length).toBeGreaterThan(0);
    expect(opp!.requiredEvidence).toContain(
      "service area (distinct from residence)",
    );
    expect(opp!.measurement.type).toBe("acquisition_opportunity_surfaced");
    expect(opp!.measurement.localityId).toBe("brixton");
    expect(opp!.measurement.gapStatus).toBe("ZERO_SUPPLY");
  });

  it("produces a medium-priority opportunity for WEAK_SUPPLY", () => {
    const input: AcquisitionOpportunityInput = {
      gap: makeGap("WEAK_SUPPLY"),
      localityId: "kings-heath",
      localityName: "Kings Heath",
      subject: "cleaner",
    };
    const opp = toAcquisitionOpportunity(input);
    expect(opp).not.toBeNull();
    expect(opp!.priority).toBe("medium");
    expect(opp!.category).toBe("cleaner");
  });

  it("never invents providers or demand numbers", () => {
    const opp = toAcquisitionOpportunity({
      gap: makeGap("ZERO_SUPPLY"),
      localityId: "brixton",
      localityName: "Brixton",
      subject: "gardener",
    });
    expect(opp).not.toBeNull();
    expect(JSON.stringify(opp)).not.toMatch(/providerId|demand|volume|review/i);
    expect(opp!.requiredEvidence.every((e) => typeof e === "string")).toBe(true);
  });

  it("keeps capability ≠ willingness / residence ≠ service area explicit", () => {
    const opp = toAcquisitionOpportunity({
      gap: makeGap("ZERO_SUPPLY"),
      localityId: "brixton",
      localityName: "Brixton",
      subject: "plumber",
    });
    expect(opp!.requiredEvidence).toEqual(
      expect.arrayContaining([
        "capability statement (what the person can do)",
        "willingness to be found for this kind of work",
        "service area (distinct from residence)",
        "availability windows or explicit 'availability unknown'",
      ]),
    );
  });

  it("measurement payload contains no PII fields", () => {
    const opp = toAcquisitionOpportunity({
      gap: makeGap("ZERO_SUPPLY"),
      localityId: "brixton",
      localityName: "Brixton",
      subject: "electrician",
      now: "2026-10-06T18:00:00Z",
    });
    const m = opp!.measurement;
    expect(Object.keys(m).sort()).toEqual(
      ["category", "gapStatus", "localityId", "timestamp", "type"].sort(),
    );
  });
});
