import { describe, expect, test } from "bun:test";
import {
  createProgrammeState,
  updateProgrammeState,
  validateProgrammeState,
  type ProgrammeState,
} from "./programme-state";

const evidence = [{ id: "repo-1", source: "github://example/issue/1" }];

function state(): ProgrammeState {
  return createProgrammeState({
    stateId: "programme-state-1",
    updatedAt: "2026-10-07T12:00:00.000Z",
    objective: {
      id: "objective-1",
      statement: "Build a bounded Programme OS state seam",
      constraints: ["No autonomous production mutation"],
    },
    project: {
      projectId: "project-1",
      status: "active",
      summary: "Implement the first programme state contract",
      completed: ["Programme constitution"],
      active: ["State seam"],
      blocked: [],
    },
    capabilityNeeds: [
      {
        capability: "state modelling",
        need: "missing",
        evidence,
        reason: "No canonical programme state contract exists yet",
      },
    ],
    frontierSignals: [
      {
        id: "frontier-1",
        statement: "Programme state can be represented deterministically",
        epistemic: "PLAUSIBLE",
        evidence,
        implication: "Enables bounded orchestration later",
      },
    ],
    claims: [
      { text: "The constitution exists", epistemic: "REAL", evidence },
      { text: "The learner's next capability is unknown", epistemic: "UNKNOWN", evidence: [] },
    ],
    uncertainties: ["No evidence yet for learner mastery"],
    nextActions: [
      {
        id: "task-1",
        statement: "Review the state contract",
        bounded: true,
        owner: "human_ai",
        risk: "low",
        requiresHumanGate: false,
        acceptance: ["Contract reviewed"],
      },
    ],
    status: "active",
  });
}

describe("programme-state", () => {
  test("constructs a valid state while preserving UNKNOWN", () => {
    const value = state();
    expect(validateProgrammeState(value)).toEqual({ valid: true, errors: [] });
    expect(value.claims.find((claim) => claim.epistemic === "UNKNOWN")?.text).toContain("unknown");
  });

  test("rejects REAL claims without evidence", () => {
    const value = state();
    value.claims = [{ text: "Unsupported fact", epistemic: "REAL", evidence: [] }];
    expect(validateProgrammeState(value).valid).toBe(false);
  });

  test("rejects positive confidence for UNKNOWN", () => {
    const value = state();
    value.claims = [{ text: "Unknown", epistemic: "UNKNOWN", evidence: [], confidence: 0.4 }];
    expect(validateProgrammeState(value).valid).toBe(false);
  });

  test("requires a human gate for critical actions", () => {
    const value = state();
    value.nextActions = [
      {
        id: "danger",
        statement: "Do something irreversible",
        bounded: true,
        owner: "human_ai",
        risk: "critical",
        requiresHumanGate: false,
        acceptance: ["Done"],
      },
    ];
    expect(validateProgrammeState(value).valid).toBe(false);
  });

  test("requires explicit change evidence and reason", () => {
    const previous = state();
    const next = { ...state(), updatedAt: "2026-10-07T13:00:00.000Z" };
    expect(() =>
      updateProgrammeState(previous, next, {
        at: next.updatedAt,
        changed: [],
        reason: "",
        evidence: [],
        epistemic: "UNKNOWN",
      }),
    ).toThrow();
  });

  test("returns a durable update record", () => {
    const previous = state();
    const next = {
      ...state(),
      updatedAt: "2026-10-07T13:00:00.000Z",
      uncertainties: ["A new uncertainty"],
    };
    const result = updateProgrammeState(previous, next, {
      at: next.updatedAt,
      changed: ["uncertainties"],
      reason: "A review surfaced a previously unrecorded uncertainty",
      evidence,
      epistemic: "REAL",
    });
    expect(result.update.stateId).toBe(previous.stateId);
    expect(result.update.changed).toEqual(["uncertainties"]);
  });
});
