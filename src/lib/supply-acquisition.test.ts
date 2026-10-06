import { describe, expect, it } from "vitest";
import { buildAcquisitionOpportunity } from "./supply-acquisition";
import type { SupplyGapResult } from "./supply-gap";
import type { Need } from "./needs";

const need: Pick<Need, "id" | "title" | "category" | "placeId"> = {
  id: "need-1",
  title: "Gardener for a small garden",
  category: "gardening",
  placeId: "kings-heath",
};

const gap = (status: SupplyGapResult["status"]): SupplyGapResult => ({
  status,
  reason: `canonical evidence: ${status}`,
  strongCount: status === "SATISFIED" ? 1 : 0,
  totalCount: status === "ZERO_SUPPLY" ? 0 : 1,
  quiet: status === "ZERO_SUPPLY",
});

describe("buildAcquisitionOpportunity", () => {
  it("creates no opportunity when canonical supply is satisfied", () => {
    expect(buildAcquisitionOpportunity(need, gap("SATISFIED"))).toBeNull();
  });

  it("turns weak supply into a review-required provider claim opportunity", () => {
    const result = buildAcquisitionOpportunity(need, gap("WEAK_SUPPLY"));
    expect(result).toMatchObject({
      localityId: "kings-heath",
      gapStatus: "WEAK_SUPPLY",
      status: "REVIEW_REQUIRED",
      action: "provider_claim",
      humanGate: "REQUIRED",
    });
    expect(result?.evidence.canonicalAuthority).toBe("findSupply");
  });

  it("turns zero canonical supply into onboarding without claiming absence", () => {
    const result = buildAcquisitionOpportunity(need, gap("ZERO_SUPPLY"));
    expect(result).toMatchObject({
      gapStatus: "ZERO_SUPPLY",
      status: "REVIEW_REQUIRED",
      action: "provider_onboarding",
    });
    expect(result?.reason).toContain("does not prove");
  });

  it("keeps unknown locality non-actionable", () => {
    const result = buildAcquisitionOpportunity(need, gap("UNKNOWN_LOCALITY"));
    expect(result).toMatchObject({
      localityResolved: false,
      status: "NOT_ACTIONABLE",
      action: "evidence_review",
      humanGate: "REQUIRED",
    });
  });
});
