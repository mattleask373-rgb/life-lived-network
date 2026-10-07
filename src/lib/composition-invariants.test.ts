import { describe, expect, it } from "vitest";
import {
  handoffPreservesEpistemic,
  realRequiresLiveEvidence,
  staleCannotElevate,
  type StagePayload,
} from "./composition-invariants";

function stage(
  partial: Partial<StagePayload> & Pick<StagePayload, "stage" | "epistemic">,
): StagePayload {
  return {
    evidenceIds: ["e1"],
    risk: "low",
    reversible: true,
    requiresHumanGate: false,
    uncertainty: ["availability"],
    ...partial,
  };
}

describe("composition invariants — 7 adversarial vectors", () => {
  it("1 REAL evidence: REAL may pass when evidence persists", () => {
    const up = stage({ stage: "reality-delta", epistemic: "REAL", evidenceIds: ["e1"] });
    const down = stage({
      stage: "frontier",
      epistemic: "REAL",
      evidenceIds: ["e1"],
      uncertainty: ["availability"],
    });
    expect(handoffPreservesEpistemic(up, down).allowed).toBe(true);
  });

  it("2 UNKNOWN cannot become REAL", () => {
    const up = stage({ stage: "frontier", epistemic: "UNKNOWN", evidenceIds: [] });
    const down = stage({ stage: "expansion", epistemic: "REAL", evidenceIds: [] });
    const r = handoffPreservesEpistemic(up, down);
    expect(r.allowed).toBe(false);
    expect(r.errors.some((e) => e.includes("UNKNOWN"))).toBe(true);
  });

  it("3 SPECULATIVE cannot silently become PLAUSIBLE without evidence", () => {
    const up = stage({ stage: "reflection", epistemic: "SPECULATIVE" });
    const down = stage({ stage: "experiment", epistemic: "PLAUSIBLE" });
    expect(handoffPreservesEpistemic(up, down).allowed).toBe(false);
    expect(handoffPreservesEpistemic(up, down, ["e-new"]).allowed).toBe(true);
  });

  it("4 FALSIFIED: inventing evidence ids is rejected", () => {
    const up = stage({ stage: "delta", epistemic: "PLAUSIBLE", evidenceIds: ["e1"] });
    const down = stage({
      stage: "frontier",
      epistemic: "PLAUSIBLE",
      evidenceIds: ["e1", "forged"],
    });
    expect(handoffPreservesEpistemic(up, down).allowed).toBe(false);
  });

  it("5 removed/stale evidence: REAL dies when evidence removed", () => {
    expect(realRequiresLiveEvidence("REAL", ["e1"], ["e1"]).allowed).toBe(false);
    expect(realRequiresLiveEvidence("REAL", ["e1", "e2"], ["e1"]).allowed).toBe(true);
  });

  it("5b stale cannot elevate certainty", () => {
    const up = stage({ stage: "delta", epistemic: "UNKNOWN", evidenceIds: [] });
    const down = stage({
      stage: "frontier",
      epistemic: "PLAUSIBLE",
      evidenceIds: ["stale-1"],
    });
    expect(staleCannotElevate(up, down, { "stale-1": "stale" }).allowed).toBe(false);
  });

  it("6 high-risk action cannot drop human gate", () => {
    const up = stage({ stage: "experiment", epistemic: "EXPERIMENTAL" });
    const down = stage({
      stage: "task",
      epistemic: "EXPERIMENTAL",
      risk: "critical",
      reversible: false,
      requiresHumanGate: false,
    });
    expect(handoffPreservesEpistemic(up, down).allowed).toBe(false);
  });

  it("7 authority transfer: gate required on irreversible handoff", () => {
    const up = stage({ stage: "task", epistemic: "PLAUSIBLE", reversible: true });
    const down = stage({
      stage: "execute",
      epistemic: "PLAUSIBLE",
      reversible: false,
      requiresHumanGate: true,
      risk: "medium",
    });
    expect(handoffPreservesEpistemic(up, down).allowed).toBe(true);
  });
});
