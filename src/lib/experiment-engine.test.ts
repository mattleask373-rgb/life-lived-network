import { describe, expect, test } from "bun:test";
import { experimentRequiresHumanGate, preservesUncertainty, resultSupportsClaim, toProgrammeStateUpdate, validateExperimentPlan, validateExperimentResult } from "./experiment-engine";

const evidence = [{ id: "e1", source: "github://repo/issue/68" }];

describe("experiment-engine", () => {
  test("keeps hypothesis testing separate from truth", () => {
    const result = { id: "r1", experimentId: "x", observations: ["nothing decisive"], outcome: "inconclusive" as const, evidence, epistemic: "EXPERIMENTAL" as const, limitations: [], followUpUncertainty: ["still unknown"] };
    expect(resultSupportsClaim(result)).toBe(false);
    expect(preservesUncertainty(result)).toBe(true);
    expect(validateExperimentResult(result).valid).toBe(true);
  });

  test("requires gates for irreversible and high-risk experiments", () => {
    expect(experimentRequiresHumanGate({ risk: "low", reversible: true })).toBe(false);
    expect(experimentRequiresHumanGate({ risk: "low", reversible: false })).toBe(true);
    expect(experimentRequiresHumanGate({ risk: "high", reversible: true })).toBe(true);
  });

  test("rejects an ungated irreversible plan", () => {
    const result = validateExperimentPlan({ id: "x", hypothesisId: "h", question: "Does it work?", procedure: ["observe"], inputs: ["evidence"], expectedObservations: ["result"], successCriteria: ["supported"], failureCriteria: ["not supported"], reversible: false, risk: "low", requiresHumanGate: false, owner: "human_ai" });
    expect(result.valid).toBe(false);
  });

  test("rejects unsupported REAL result", () => {
    const result = validateExperimentResult({ id: "r", experimentId: "x", observations: ["observation"], outcome: "supported", evidence: [], epistemic: "REAL", limitations: [], followUpUncertainty: [] });
    expect(result.valid).toBe(false);
  });

  test("falsification preserves uncertainty and can create a state update", () => {
    const result = { id: "r2", experimentId: "x", observations: ["prediction failed"], outcome: "falsified" as const, evidence, epistemic: "EXPERIMENTAL" as const, limitations: ["small sample"], followUpUncertainty: ["which alternative explains this?"] };
    expect(validateExperimentResult(result).valid).toBe(true);
    const update = toProgrammeStateUpdate("programme-state-1", result, ["uncertainties"], "Experiment falsified the working hypothesis", "2026-10-07T17:00:00.000Z");
    expect(update.stateId).toBe("programme-state-1");
    expect(update.epistemic).toBe("EXPERIMENTAL");
  });
});
