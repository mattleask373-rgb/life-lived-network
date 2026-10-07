import { describe, expect, it } from "bun:test";
import {
  canBecomeBoundedTask,
  createFrontierObservation,
  frontierRequiresHumanGate,
  validateOpportunityFrontier,
  type OpportunityFrontierObservation,
} from "./opportunity-frontier";

function base(
  overrides: Partial<OpportunityFrontierObservation> = {},
): OpportunityFrontierObservation {
  return createFrontierObservation({
    id: "frontier-1",
    scope: "locality:test",
    objective: "understand local opportunity coverage",
    observedSupplyState: "supply was observed through canonical discovery evidence",
    sourceCoverage: "one current source plus one stale source",
    unknowns: ["demand is unknown"],
    unmetNeed: "coverage may be incomplete",
    interpretation: "PLAUSIBLE",
    candidateOpportunity: "test whether an additional source changes the observation",
    evidence: [{ id: "e1", source: "canonical-ingest", freshness: "fresh" }],
    reversible: true,
    risk: "low",
    requiresHumanGate: false,
    ...overrides,
  });
}

describe("opportunity frontier", () => {
  it("creates low-risk reversible observations without a gate", () => {
    const observation = base();
    expect(validateOpportunityFrontier(observation).valid).toBe(true);
    expect(frontierRequiresHumanGate(observation)).toBe(false);
  });

  it("requires a gate for high risk or irreversible work", () => {
    expect(
      validateOpportunityFrontier(
        base({ risk: "high", requiresHumanGate: false }),
      ).valid,
    ).toBe(false);

    expect(
      validateOpportunityFrontier(
        base({ reversible: false, requiresHumanGate: false }),
      ).valid,
    ).toBe(false);
  });

  it("requires evidence before a REAL interpretation", () => {
    const result = validateOpportunityFrontier(
      base({ interpretation: "REAL", evidence: [] }),
    );
    expect(result.valid).toBe(false);
  });

  it("does not turn UNKNOWN into a bounded execution task", () => {
    const result = canBecomeBoundedTask(base({ interpretation: "UNKNOWN" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "UNKNOWN observations require an experiment or evidence-gathering task",
    );
  });

  it("does not silently execute speculative ideas", () => {
    expect(
      canBecomeBoundedTask(base({ interpretation: "SPECULATIVE" })).valid,
    ).toBe(false);
    expect(
      canBecomeBoundedTask(base({ interpretation: "IMAGINED" })).valid,
    ).toBe(false);
  });

  it("preserves explicit unknowns", () => {
    const observation = base({ unknowns: ["availability is unknown"] });
    expect(observation.unknowns).toEqual(["availability is unknown"]);
  });

  it("rejects malformed evidence without throwing", () => {
    const result = validateOpportunityFrontier(
      base({ evidence: [null as never] }),
    );
    expect(result.valid).toBe(false);
  });

  it("rejects invented certainty without evidence", () => {
    const result = validateOpportunityFrontier(
      base({
        interpretation: "REAL",
        candidateOpportunity: "this definitely exists",
        evidence: [],
      }),
    );
    expect(result.valid).toBe(false);
  });
});
