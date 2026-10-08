import { describe, expect, it } from "vitest";
import {
  completeLearning,
  planCycle,
  recordProviderEvidence,
  verifyEvidence,
  type AuthorityContext,
  type CycleCandidate,
  type Evidence,
} from "./intelligence-cycle-runner";

const authority: AuthorityContext = {
  actorId: "actor-1",
  runId: "run-1",
  scope: "project-1",
  leaseGeneration: 2,
  attemptId: "attempt-1",
};

const source: Evidence = {
  id: "e-1",
  source: "reality",
  epistemic: "UNKNOWN",
  observedAt: "2026-10-08T00:00:00Z",
};

const candidate: CycleCandidate = {
  opportunity: {
    id: "opp-1",
    evidenceIds: ["e-1"],
    epistemic: "UNKNOWN",
    risk: "P3",
    reversible: true,
    humanGate: false,
  },
  hypothesis: {
    id: "hyp-1",
    opportunityId: "opp-1",
    epistemic: "SPECULATIVE",
  },
  task: {
    id: "task-1",
    hypothesisId: "hyp-1",
    requiredCapability: "research",
    humanGate: false,
    scope: "project-1",
  },
};

describe("intelligence cycle runner", () => {
  it("selects deterministically and preserves UNKNOWN", () => {
    const result = planCycle(
      "cycle-1",
      [candidate],
      authority,
      "provider-a",
      [source],
      {
        allowedScopes: ["project-1"],
        allowedCapabilities: ["research"],
        allowHumanGate: false,
      },
    );

    expect(result.status).toBe("COMPLETED");
    expect(result.trace.opportunity.epistemic).toBe("UNKNOWN");
    expect(result.trace.sourceEvidence[0].id).toBe("e-1");
  });

  it("rejects cross-scope authority", () => {
    expect(() =>
      planCycle(
        "cycle-2",
        [candidate],
        { ...authority, scope: "project-2" },
        "provider-a",
        [source],
        {
          allowedScopes: ["project-1"],
          allowedCapabilities: ["research"],
          allowHumanGate: false,
        },
      ),
    ).toThrow("authority scope does not match task scope");
  });

  it("rejects evidence from another attempt", () => {
    const planned = planCycle(
      "cycle-3",
      [candidate],
      authority,
      "provider-a",
      [source],
      {
        allowedScopes: ["project-1"],
        allowedCapabilities: ["research"],
        allowHumanGate: false,
      },
    );

    expect(() =>
      recordProviderEvidence(planned.trace, {
        id: "e-2",
        source: "provider-a",
        epistemic: "EXPERIMENTAL",
        observedAt: "2026-10-08T00:01:00Z",
        attemptId: "attempt-2",
      }),
    ).toThrow("evidence attempt does not match authority attempt");
  });

  it("requires verification before learning", () => {
    const planned = planCycle(
      "cycle-4",
      [candidate],
      authority,
      "provider-a",
      [source],
      {
        allowedScopes: ["project-1"],
        allowedCapabilities: ["research"],
        allowHumanGate: false,
      },
    );

    expect(() =>
      completeLearning(planned.trace, "delta", "learning"),
    ).toThrow("cannot learn before independent verification");
  });

  it("prevents epistemic inflation during verification", () => {
    const planned = planCycle(
      "cycle-5",
      [candidate],
      authority,
      "provider-a",
      [source],
      {
        allowedScopes: ["project-1"],
        allowedCapabilities: ["research"],
        allowHumanGate: false,
      },
    );

    const withEvidence = recordProviderEvidence(planned.trace, {
      id: "e-2",
      source: "provider-a",
      epistemic: "EXPERIMENTAL",
      observedAt: "2026-10-08T00:01:00Z",
      attemptId: "attempt-1",
    });

    expect(() =>
      verifyEvidence(withEvidence, {
        id: "v-1",
        source: "verifier",
        epistemic: "REAL",
        observedAt: "2026-10-08T00:02:00Z",
        attemptId: "attempt-1",
      }),
    ).toThrow("epistemic inflation");
  });

  it("blocks when no eligible capability exists", () => {
    const result = planCycle(
      "cycle-6",
      [candidate],
      authority,
      "provider-a",
      [source],
      {
        allowedScopes: ["project-1"],
        allowedCapabilities: ["implementation"],
        allowHumanGate: false,
      },
    );

    expect(result.status).toBe("BLOCKED");
    expect(result.trace.unresolvedBlockers).toContain("no eligible candidate");
  });
});
