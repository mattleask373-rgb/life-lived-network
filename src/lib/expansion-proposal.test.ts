import { describe, expect, test } from "vitest";
import {
  canPromoteToAccepted,
  createExpansionProposal,
  findExpansionOverlaps,
  requiresHumanGate,
  validateExpansionProposal,
  type ExpansionProposal,
} from "./expansion-proposal";

const evidence = [{ id: "test-1", source: "github://example/issue/65" }];

function proposal(
  overrides: Partial<ExpansionProposal> = {},
): ExpansionProposal {
  return {
    id: "expansion-1",
    originatingObjective: "Increase useful real-world discovery",
    originatingTask: "task-1",
    observedPattern: "The current category cannot represent the observed workflow",
    evidence,
    currentCategory: "opportunity",
    currentMechanism: "canonical discovery",
    limitation: "The current representation loses the workflow state",
    proposedCategory: "workflow-opportunity",
    proposedMechanism: "bounded workflow representation",
    expectedLeverage: ["better representation"],
    affectedCapabilities: ["discovery"],
    alternativesConsidered: ["extend current category", "do not change"],
    experimentPlan: ["model two real examples", "compare representation loss"],
    falsificationCriteria: ["no representation improvement"],
    reversible: true,
    risk: "low",
    requiresHumanGate: false,
    epistemic: "EXPERIMENTAL",
    status: "testing",
    ...overrides,
  };
}

describe("expansion-proposal", () => {
  test("accepts every supported epistemic class without treating it as fact", () => {
    for (const epistemic of [
      "REAL",
      "PLAUSIBLE",
      "EXPERIMENTAL",
      "SPECULATIVE",
      "IMAGINED",
      "UNKNOWN",
    ] as const) {
      const candidate = proposal({
        epistemic,
        status: epistemic === "REAL" ? "testing" : "proposed",
      });
      expect(validateExpansionProposal(candidate).valid).toBe(true);
    }
  });

  test("reports malformed evidence without throwing", () => {
    const candidate = proposal({
      epistemic: "REAL",
      evidence: undefined as unknown as ExpansionProposal["evidence"],
    });
    expect(() => validateExpansionProposal(candidate)).not.toThrow();
    expect(validateExpansionProposal(candidate).valid).toBe(false);
  });

  test("requires a human gate for high-risk and irreversible proposals", () => {
    expect(requiresHumanGate({ risk: "high", reversible: true })).toBe(true);
    expect(requiresHumanGate({ risk: "low", reversible: false })).toBe(true);
    expect(
      validateExpansionProposal(
        proposal({ risk: "critical", reversible: true, requiresHumanGate: false }),
      ).valid,
    ).toBe(false);
  });

  test("does not allow UNKNOWN to become accepted", () => {
    const candidate = proposal({
      epistemic: "UNKNOWN",
      status: "accepted",
      resultingTaskId: "task-2",
    });
    expect(validateExpansionProposal(candidate).valid).toBe(false);
  });

  test("requires a bounded task reference when accepted", () => {
    const accepted = proposal({
      status: "accepted",
      epistemic: "PLAUSIBLE",
      resultingTaskId: "task-2",
    });
    expect(validateExpansionProposal(accepted).valid).toBe(true);
    expect(
      validateExpansionProposal(
        proposal({ status: "accepted", epistemic: "PLAUSIBLE" }),
      ).valid,
    ).toBe(false);
  });

  test("does not silently attach a task to a proposal that is not accepted", () => {
    expect(
      validateExpansionProposal(
        proposal({ status: "testing", resultingTaskId: "task-2" }),
      ).valid,
    ).toBe(false);
  });

  test("detects duplicate and overlapping proposals without a matcher", () => {
    const candidate = proposal({ id: "candidate" });
    const overlaps = findExpansionOverlaps(candidate, [
      proposal({ id: "existing" }),
      proposal({
        id: "category-only",
        proposedMechanism: "another mechanism",
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
      canPromoteToAccepted(
        proposal({ status: "proposed", epistemic: "PLAUSIBLE" }),
      ).valid,
    ).toBe(false);
    expect(
      canPromoteToAccepted(
        proposal({ status: "testing", epistemic: "UNKNOWN" }),
      ).valid,
    ).toBe(false);
  });

  test("promotion can validate a tested, bounded, reversible proposal", () => {
    const candidate = proposal({
      status: "testing",
      epistemic: "PLAUSIBLE",
    });
    expect(canPromoteToAccepted(candidate).valid).toBe(true);
  });

  test("creation does not mutate caller-owned arrays", () => {
    const candidate = proposal();
    const originalEvidence = candidate.evidence;
    const created = createExpansionProposal(candidate);
    expect(created.evidence).not.toBe(originalEvidence);
    expect(created.expectedLeverage).not.toBe(candidate.expectedLeverage);
  });
});
