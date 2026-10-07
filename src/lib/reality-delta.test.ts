import { describe, expect, it } from "vitest";
import {
  canBecomeBoundedRealityAction,
  compareRealitySnapshots,
  realityDeltaRequiresHumanGate,
  validateRealityDelta,
  validateRealitySnapshot,
  type RealitySnapshot,
} from "./reality-delta";

function snapshot(overrides: Partial<RealitySnapshot> = {}): RealitySnapshot {
  return {
    id: "snapshot-1",
    scope: "locality:test",
    objective: "observe local opportunity state",
    observedState: "One published opportunity is present",
    evidence: [
      {
        id: "evidence-1",
        source: "fixture",
        claim: "A published opportunity exists",
        observedAt: "2026-10-08T00:00:00Z",
      },
    ],
    unknowns: ["Current availability"],
    epistemic: "REAL",
    capturedAt: "2026-10-08T00:00:00Z",
    ...overrides,
  };
}

describe("reality delta", () => {
  it("accepts an evidence-backed snapshot", () =>
    expect(validateRealitySnapshot(snapshot())).toBe(true));
  it("rejects REAL snapshots without evidence", () =>
    expect(validateRealitySnapshot(snapshot({ evidence: [] }))).toBe(false));
  it("rejects duplicate evidence identifiers", () =>
    expect(
      validateRealitySnapshot(
        snapshot({
          evidence: [
            { id: "same", source: "fixture", claim: "first" },
            { id: "same", source: "fixture", claim: "second" },
          ],
        }),
      ),
    ).toBe(false));

  it("detects added, removed and persistent evidence", () => {
    const previous = snapshot();
    const current = snapshot({
      id: "snapshot-2",
      observedState: "Two published opportunities are present",
      evidence: [
        ...previous.evidence,
        { id: "evidence-2", source: "fixture", claim: "A second published opportunity exists" },
      ],
      unknowns: ["Current availability", "Whether either opportunity remains active"],
    });
    const delta = compareRealitySnapshots(previous, current);
    expect(delta.changed).toBe(true);
    expect(delta.addedEvidence.map((item) => item.id)).toEqual(["evidence-2"]);
    expect(delta.removedEvidence).toEqual([]);
    expect(delta.persistentEvidence.map((item) => item.id)).toEqual(["evidence-1"]);
    expect(delta.newUnknowns).toEqual(["Whether either opportunity remains active"]);
    expect(delta.persistentUnknowns).toEqual(["Current availability"]);
  });

  it("represents removed evidence without claiming reality disappeared", () => {
    const delta = compareRealitySnapshots(
      snapshot(),
      snapshot({
        id: "snapshot-2",
        observedState: "No published opportunity is currently observed",
        evidence: [],
        epistemic: "UNKNOWN",
        unknowns: ["Whether the previous opportunity still exists"],
      }),
    );
    expect(delta.removedEvidence.map((item) => item.id)).toEqual(["evidence-1"]);
    expect(delta.epistemic).toBe("UNKNOWN");
    expect(delta.uncertainty).toContain("Whether the previous opportunity still exists");
  });

  it("keeps UNKNOWN from becoming a bounded action", () => {
    const delta = compareRealitySnapshots(
      snapshot(),
      snapshot({
        id: "snapshot-2",
        observedState: "No direct evidence yet",
        evidence: [],
        epistemic: "UNKNOWN",
      }),
      {
        kind: "investigation",
        summary: "Check whether the previous signal is still present",
        bounded: true,
        reversible: true,
        risk: "low",
        requiresHumanGate: false,
      },
    );
    expect(canBecomeBoundedRealityAction(delta)).toBe(false);
  });

  it("requires human gates for high-risk or irreversible actions", () => {
    expect(realityDeltaRequiresHumanGate("high", true)).toBe(true);
    expect(realityDeltaRequiresHumanGate("low", false)).toBe(true);
  });

  it("rejects malformed delta evidence without throwing", () => {
    const delta = compareRealitySnapshots(snapshot(), snapshot({ id: "snapshot-2" }));
    expect(
      validateRealityDelta({ ...delta, addedEvidence: [{ id: "", source: "", claim: "" }] }),
    ).toBe(false);
  });

  it("allows an evidence-backed investigation as a bounded next action", () => {
    const current = snapshot({
      id: "snapshot-2",
      observedState: "Two published opportunities are present",
      evidence: [
        ...snapshot().evidence,
        { id: "evidence-2", source: "fixture", claim: "A second published opportunity exists" },
      ],
    });
    const delta = compareRealitySnapshots(snapshot(), current, {
      kind: "investigation",
      summary: "Verify whether the new opportunity is still current",
      bounded: true,
      reversible: true,
      risk: "low",
      requiresHumanGate: false,
    });
    expect(validateRealityDelta(delta)).toBe(true);
    expect(canBecomeBoundedRealityAction(delta)).toBe(true);
  });
});
