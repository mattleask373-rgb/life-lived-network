import { describe, expect, it } from "vitest";
import {
  requiresHumanGate,
  validateEpistemicClaim,
  validateEvidenceRefs,
} from "./epistemic-core";

describe("epistemic-core", () => {
  it("requires evidence for REAL", () => {
    expect(validateEpistemicClaim({ epistemic: "REAL", evidenceCount: 0 }).valid).toBe(false);
    expect(validateEpistemicClaim({ epistemic: "REAL", evidenceCount: 1 }).valid).toBe(true);
  });

  it("blocks UNKNOWN and IMAGINED as world facts", () => {
    expect(
      validateEpistemicClaim({
        epistemic: "UNKNOWN",
        evidenceCount: 0,
        assertingWorldFact: true,
      }).valid,
    ).toBe(false);
    expect(
      validateEpistemicClaim({
        epistemic: "IMAGINED",
        evidenceCount: 0,
        assertingWorldFact: true,
      }).valid,
    ).toBe(false);
  });

  it("requires human gate for high risk or irreversible work", () => {
    expect(requiresHumanGate("low", true)).toBe(false);
    expect(requiresHumanGate("high", true)).toBe(true);
    expect(requiresHumanGate("low", false)).toBe(true);
  });

  it("validates evidence refs", () => {
    expect(validateEvidenceRefs([{ id: "e1", source: "fixture" }]).valid).toBe(true);
    expect(validateEvidenceRefs([{ id: "", source: "x" }]).valid).toBe(false);
  });
});
