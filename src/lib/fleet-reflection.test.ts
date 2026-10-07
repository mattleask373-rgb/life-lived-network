import { describe, expect, it } from "bun:test";
import {
  createFleetReflectionFinding,
  nextBoundedReflectionActions,
  reflectionRequiresHumanGate,
  validateFleetReflectionCycle,
  validateFleetReflectionFinding,
} from "./fleet-reflection";

const baseFinding = {
  id: "finding-1",
  cycleId: "cycle-1",
  observation: "The current workflow did not expose a useful next question.",
  surprise: "A missing question was more important than a missing feature.",
  assumptionChallenged: "More implementation is always the next best move.",
  evidence: [{ id: "commit-1", source: "github", locator: "commit/abc" }],
  epistemic: "PLAUSIBLE" as const,
  uncertainty: ["We have not tested this with real users."],
  openQuestions: ["Which unanswered question has the highest leverage?"],
  affectedAreas: ["agent coordination", "product discovery"],
  reversible: true,
  risk: "low" as const,
  disposition: "investigate" as const,
  nextAction: {
    kind: "investigation" as const,
    summary: "Inspect the next cycle for repeated unanswered questions.",
    bounded: true,
    reversible: true,
    risk: "low" as const,
    requiresHumanGate: false,
  },
};

describe("fleet reflection", () => {
  it("records a creative finding without turning it into fact", () => {
    expect(validateFleetReflectionFinding(baseFinding)).toEqual([]);
  });

  it("requires evidence for REAL claims", () => {
    expect(
      validateFleetReflectionFinding({
        ...baseFinding,
        evidence: [],
        epistemic: "REAL",
      }),
    ).toContain("REAL reflections require evidence");
  });

  it("keeps UNKNOWN explicit rather than inventing certainty", () => {
    expect(
      validateFleetReflectionFinding({
        ...baseFinding,
        evidence: [],
        epistemic: "UNKNOWN",
        uncertainty: [],
      }),
    ).toContain("UNKNOWN reflections must preserve explicit uncertainty");
  });

  it("allows UNKNOWN to point toward investigation", () => {
    const finding = {
      ...baseFinding,
      evidence: [],
      epistemic: "UNKNOWN" as const,
      uncertainty: ["We do not know whether this pattern is real."],
      nextAction: {
        kind: "investigation" as const,
        summary: "Gather evidence.",
        bounded: true,
        reversible: true,
        risk: "low" as const,
        requiresHumanGate: false,
      },
    };
    expect(validateFleetReflectionFinding(finding)).toEqual([]);
  });

  it("requires a human gate for high-risk or irreversible actions", () => {
    expect(reflectionRequiresHumanGate("high", true)).toBe(true);
    expect(reflectionRequiresHumanGate("low", false)).toBe(true);
    expect(
      validateFleetReflectionFinding({
        ...baseFinding,
        risk: "high",
        requiresHumanGate: false,
      }),
    ).toContain("human-gate requirement does not match risk/reversibility");
  });

  it("rejects an unbounded follow-up", () => {
    expect(
      validateFleetReflectionFinding({
        ...baseFinding,
        nextAction: {
          ...baseFinding.nextAction,
          bounded: false,
        },
      }),
    ).toContain("reflection actions must be explicitly bounded");
  });

  it("does not let speculative findings become direct review authority", () => {
    expect(
      validateFleetReflectionFinding({
        ...baseFinding,
        epistemic: "SPECULATIVE",
        nextAction: {
          ...baseFinding.nextAction,
          kind: "review",
        },
      }),
    ).toContain("uncertain/speculative findings cannot become direct review authority");
  });

  it("rejects duplicate finding ids in a cycle", () => {
    const cycle = {
      cycleId: "cycle-1",
      startedAt: "2026-10-08T00:00:00Z",
      endedAt: "2026-10-09T00:00:00Z",
      timeboxHours: 24,
      findings: [baseFinding, { ...baseFinding }],
    };
    expect(validateFleetReflectionCycle(cycle)).toContain(
      "duplicate finding id: finding-1",
    );
  });

  it("rejects findings belonging to another cycle", () => {
    const cycle = {
      cycleId: "cycle-2",
      startedAt: "2026-10-08T00:00:00Z",
      endedAt: "2026-10-09T00:00:00Z",
      timeboxHours: 24,
      findings: [baseFinding],
    };
    expect(validateFleetReflectionCycle(cycle)).toContain(
      "finding finding-1 belongs to another cycle",
    );
  });

  it("returns only bounded next actions after valid reflection", () => {
    const cycle = {
      cycleId: "cycle-1",
      startedAt: "2026-10-08T00:00:00Z",
      endedAt: "2026-10-09T00:00:00Z",
      timeboxHours: 24,
      findings: [
        createFleetReflectionFinding(baseFinding),
        createFleetReflectionFinding({
          ...baseFinding,
          id: "finding-2",
          disposition: "superseded",
        }),
      ],
    };
    expect(nextBoundedReflectionActions(cycle)).toHaveLength(1);
  });
});
