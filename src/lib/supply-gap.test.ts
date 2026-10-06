import { describe, expect, it } from "bun:test";
import { classifySupplyGap } from "./supply-gap";
import type { SupplyAnswer, SupplyResult } from "./supply-engine";
import type { Need } from "./needs";

function makeResult(band: SupplyResult["band"], id = "r1"): SupplyResult {
  return {
    id,
    band,
    title: "Test",
    what: "test",
    where: "somewhere",
    when: "sometime",
    why: [],
    caveat: "",
    actions: ["view"],
    supplyType: "LATENT",
    status: "ACTIVE",
    signals: [],
    reasons: [],
    confidence: "low",
    freshness: "unknown",
    trust: "unverified",
    provenance: { origin: "person", label: "test", sourceId: id },
    constraints: [],
  };
}

function makeSupply(results: SupplyResult[], quiet = results.length === 0): SupplyAnswer {
  return {
    need: {
      id: "need-1",
      title: "test need",
      category: "gardening",
      placeId: "place-1",
      timezone: "Europe/London",
      requiredSkills: [],
      requiredQualifications: [],
      paymentType: "paid",
      flexibility: "flexible",
    } as Need,
    results,
    quiet,
    bandsSearched: [],
    diagnostics: {
      peopleConsidered: 0,
      excludedByPlace: 0,
      excludedByFreshness: 0,
      excludedByQualification: 0,
      excludedByCapability: 0,
      excludedByStatus: 0,
      excludedByTime: 0,
    },
    trace: [],
  };
}

describe("classifySupplyGap", () => {
  it("returns UNKNOWN_LOCALITY when locality is not resolved", () => {
    const result = classifySupplyGap({
      supply: makeSupply([makeResult("direct")]),
      localityResolved: false,
    });
    expect(result.status).toBe("UNKNOWN_LOCALITY");
    expect(result.strongCount).toBe(0);
  });

  it("returns SATISFIED when strong results exist", () => {
    const result = classifySupplyGap({
      supply: makeSupply([makeResult("direct"), makeResult("local_capability", "r2")]),
      localityResolved: true,
    });
    expect(result.status).toBe("SATISFIED");
    expect(result.strongCount).toBe(2);
  });

  it("returns WEAK_SUPPLY when only related results exist", () => {
    const result = classifySupplyGap({
      supply: makeSupply([makeResult("related")]),
      localityResolved: true,
    });
    expect(result.status).toBe("WEAK_SUPPLY");
    expect(result.strongCount).toBe(0);
    expect(result.totalCount).toBe(1);
  });

  it("returns ZERO_SUPPLY when no results and locality is known", () => {
    const result = classifySupplyGap({
      supply: makeSupply([], true),
      localityResolved: true,
    });
    expect(result.status).toBe("ZERO_SUPPLY");
    expect(result.quiet).toBe(true);
    expect(result.reason).toContain("does not prove that no real-world provider exists");
  });

  it("never invents providers or matches people", () => {
    // The function has no people input and cannot invent results.
    const result = classifySupplyGap({
      supply: makeSupply([]),
      localityResolved: true,
    });
    expect(result.status).toBe("ZERO_SUPPLY");
    expect(result.totalCount).toBe(0);
  });

  it("treats zero canonical results as ZERO_SUPPLY, not as evidence of absence", () => {
    const result = classifySupplyGap({
      supply: makeSupply([]),
      localityResolved: true,
    });
    expect(result.status).toBe("ZERO_SUPPLY");
    expect(result.reason.toLowerCase()).not.toContain("no providers exist");
  });
});
