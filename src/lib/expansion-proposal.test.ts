import { describe, expect, it } from "vitest";

import {
  acceptedProposalToTaskSketch,
  classifyEvidenceCompleteness,
  expansionRequiresHumanGate,
  findOverlappingProposals,
  validateExpansionProposal,
  type ExpansionProposal,
} from "./expansion-proposal";

const evidence = [{ id: "e1", source: "github://repo/issue/65" }];

function base(overrides: Partial<ExpansionProposal> = {}): ExpansionProposal {
  return {
    id: "exp-1",
    originatingObjective: "Improve sparse locality honesty",
    observedPattern: "Sparse places look empty and users abandon",
    evidence,
    currentCategory: "map-first locality page",
    limitation: "Presentation does not adapt to real density",
    proposedMechanism: "Density-aware progressive disclosure",
    expectedLeverage: "Sparse places remain useful without fabricated supply",
    alternativesConsidered: ["Always show large map", "Hide map entirely"],
    experimentPlan: "A/B layout heights against engagement in quiet localities",
    falsificationCondition: "No improvement in time-to-first-useful-content",
    reversible: true,
    risk: "low",
    requiresHumanGate: false,
    epistemic: "EXPERIMENTAL",
    status: "proposed",
    ...overrides,
  };
}

describe("expansion-proposal", () => {
  it("rejects REAL classification for proposals", () => {
    const result = validateExpansionProposal(base({ epistemic: "REAL" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("REAL"))).toBe(true);
  });

  it("requires human gate for irreversible work", () => {
    expect(expansionRequiresHumanGate({ risk: "low", reversible: false })).toBe(true);
    expect(expansionRequiresHumanGate({ risk: "high", reversible: true })).toBe(true);
    expect(expansionRequiresHumanGate({ risk: "low", reversible: true })).toBe(false);
  });

  it("rejects ungated high-risk proposals", () => {
    const result = validateExpansionProposal(
      base({ risk: "critical", reversible: false, requiresHumanGate: false }),
    );
    expect(result.valid).toBe(false);
  });

  it("accepts a well-formed experimental proposal", () => {
    expect(validateExpansionProposal(base()).valid).toBe(true);
  });

  it("detects overlapping proposals by mechanism", () => {
    const a = base({ id: "a" });
    const b = base({ id: "b", limitation: "Different limitation text" });
    const overlaps = findOverlappingProposals(a, [b]);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]!.id).toBe("b");
  });

  it("only accepted proposals become task sketches", () => {
    const rejected = acceptedProposalToTaskSketch(base({ status: "proposed" }));
    expect(rejected.ok).toBe(false);

    const accepted = acceptedProposalToTaskSketch(
      base({ status: "accepted", resultingTaskRef: "task-100" }),
    );
    expect(accepted.ok).toBe(true);
    expect(accepted.sketch?.proposalId).toBe("exp-1");
    expect(accepted.sketch?.scopeOut.some((s) => s.includes("second discovery"))).toBe(true);
  });

  it("classifies evidence completeness", () => {
    expect(classifyEvidenceCompleteness({ evidence: [], epistemic: "UNKNOWN" })).toBe("empty");
    expect(classifyEvidenceCompleteness({ evidence, epistemic: "EXPERIMENTAL" })).toBe("minimal");
  });

  it("UNKNOWN cannot be accepted", () => {
    const result = validateExpansionProposal(
      base({ epistemic: "UNKNOWN", status: "accepted", resultingTaskRef: "t1" }),
    );
    expect(result.valid).toBe(false);
  });
});
