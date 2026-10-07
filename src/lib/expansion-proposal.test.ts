import { describe, expect, test } from "vitest";

import {
  canPromoteToAccepted,
  expansionRequiresHumanGate,
  findExpansionOverlaps,
  validateExpansionProposal,
  type ExpansionProposal,
} from "./expansion-proposal";

const evidence = [{ id: "e1", source: "github://repo/issue/65" }];

function proposal(overrides: Partial<ExpansionProposal> = {}): ExpansionProposal {
  return {
    id: "exp-1",
    originatingObjective: "Improve sparse locality honesty",
    observedPattern: "Sparse places look empty and users abandon",
    evidence,
    proposedCategory: "presentation",
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
  test("rejects REAL classification for proposals", () => {
    const result = validateExpansionProposal(proposal({ epistemic: "REAL" }));
    expect(result.valid).toBe(false);
  });

  test("requires human gate for irreversible or high-risk work", () => {
    expect(expansionRequiresHumanGate({ risk: "low", reversible: false })).toBe(true);
    expect(expansionRequiresHumanGate({ risk: "high", reversible: true })).toBe(true);
    expect(expansionRequiresHumanGate({ risk: "low", reversible: true })).toBe(false);
  });

  test("rejects ungated high-risk proposals", () => {
    const result = validateExpansionProposal(
      proposal({ risk: "critical", reversible: false, requiresHumanGate: false }),
    );
    expect(result.valid).toBe(false);
  });

  test("accepts a well-formed experimental proposal", () => {
    expect(validateExpansionProposal(proposal()).valid).toBe(true);
  });

  test("requires a bounded task reference when accepted", () => {
    const accepted = proposal({
      status: "accepted",
      epistemic: "PLAUSIBLE",
      resultingTaskId: "task-2",
    });
    expect(validateExpansionProposal(accepted).valid).toBe(true);
    expect(
      validateExpansionProposal(proposal({ status: "accepted", epistemic: "PLAUSIBLE" })).valid,
    ).toBe(false);
  });

  test("does not silently attach a task to a proposal that is not accepted", () => {
    expect(
      validateExpansionProposal(proposal({ status: "testing", resultingTaskId: "task-2" })).valid,
    ).toBe(false);
  });

  test("detects duplicate and overlapping proposals without a matcher", () => {
    const candidate = proposal({ id: "candidate" });
    const overlaps = findExpansionOverlaps(candidate, [
      proposal({ id: "existing" }),
      proposal({
        id: "category-only",
        proposedMechanism: "another mechanism",
        originatingObjective: "a different objective",
      }),
    ]);

    expect(overlaps).toEqual([
      {
        proposalId: "existing",
        overlap: "exact",
        reason: "same proposed category and mechanism",
      },
      {
        proposalId: "category-only",
        overlap: "category",
        reason: "same proposed category",
      },
    ]);
  });

  test("promotion requires testing and evidence-backed epistemic status", () => {
    expect(
      canPromoteToAccepted(proposal({ status: "proposed", epistemic: "PLAUSIBLE" })).valid,
    ).toBe(false);
    expect(
      canPromoteToAccepted(proposal({ status: "testing", epistemic: "UNKNOWN" })).valid,
    ).toBe(false);
    expect(
      canPromoteToAccepted(
        proposal({ status: "testing", epistemic: "PLAUSIBLE", resultingTaskId: "task-3" }),
      ).valid,
    ).toBe(true);
  });

  test("rejects malformed evidence", () => {
    expect(
      validateExpansionProposal(
        proposal({ evidence: [{ id: "", source: "x" }] as never }),
      ).valid,
    ).toBe(false);
  });

  test("UNKNOWN cannot be accepted", () => {
    const result = validateExpansionProposal(
      proposal({ epistemic: "UNKNOWN", status: "accepted", resultingTaskId: "t1" }),
    );
    expect(result.valid).toBe(false);
  });
});
