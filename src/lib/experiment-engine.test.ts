import { describe, expect, test } from "bun:test";
import {
  experimentRequiresHumanGate,
  preservesUncertainty,
  resultSupportsClaim,
  toProgrammeStateUpdate,
  validateExperimentPlan,
  validateExperimentResult,
  validateHypothesis,
  validateLearning,
} from "./experiment-engine";

const evidence = [{ id: "e1", source: "github://repo/issue/68" }];

describe("experiment-engine", () => {
  test("keeps hypotheses separate from truth", () => {
    const hypothesis = {
      id: "h1",
      originatingStateId: "programme-state-1",
      uncertainty: "Whether the proposed workflow improves discovery",
      statement: "A bounded workflow may improve discovery",
      evidence,
      epistemic: "EXPERIMENTAL" as const,
      falsificationCondition: "The workflow produces no measurable improvement",
    };
    expect(validateHypothesis(hypothesis).valid).toBe(true);
    expect(validateHypothesis({ ...hypothesis, epistemic: "REAL" }).valid).toBe(false);
  });

  test("requires gates for irreversible and high-risk experiments", () => {
    expect(experimentRequiresHumanGate({ risk: "low", reversible: true })).toBe(false);
    expect(experimentRequiresHumanGate({ risk: "low", reversible: false })).toBe(true);
    expect(experimentRequiresHumanGate({ risk: "high", reversible: true })).toBe(true);
  });

  test("rejects an ungated irreversible plan", () => {
    const result = validateExperimentPlan({
      id: "x",
      hypothesisId: "h",
      question: "Does it work?",
      procedure: ["observe"],
      inputs: ["evidence"],
      expectedObservations: ["result"],
      successCriteria: ["supported"],
      failureCriteria: ["not supported"],
      reversible: false,
      risk: "low",
      requiresHumanGate: false,
      owner: "human_ai",
    });
    expect(result.valid).toBe(false);
  });

  test("rejects unsupported REAL and UNKNOWN certainty", () => {
    const unsupported = validateExperimentResult({
      id: "r",
      experimentId: "x",
      observations: ["observation"],
      outcome: "supported",
      evidence: [],
      epistemic: "REAL",
      limitations: [],
      followUpUncertainty: [],
    });
    expect(unsupported.valid).toBe(false);

    const unknown = validateExperimentResult({
      id: "r2",
      experimentId: "x",
      observations: ["observation"],
      outcome: "supported",
      evidence,
      epistemic: "UNKNOWN",
      limitations: [],
      followUpUncertainty: [],
    });
    expect(unknown.valid).toBe(false);
  });

  test("falsification preserves uncertainty and can create a state update", () => {
    const result = {
      id: "r3",
      experimentId: "x",
      observations: ["prediction failed"],
      outcome: "falsified" as const,
      evidence,
      epistemic: "EXPERIMENTAL" as const,
      limitations: ["small sample"],
      followUpUncertainty: ["Which alternative explains this?"],
    };
    expect(validateExperimentResult(result).valid).toBe(true);
    const update = toProgrammeStateUpdate(
      "programme-state-1",
      result,
      ["uncertainties"],
      "Experiment falsified the working hypothesis",
      "2026-10-07T17:00:00.000Z",
    );
    expect(update.stateId).toBe("programme-state-1");
    expect(update.epistemic).toBe("EXPERIMENTAL");
  });

  test("rejects unsupported learning certainty and accepts bounded learning", () => {
    const unknown = validateLearning({
      id: "l1",
      sourceExperimentId: "r3",
      whatChanged: "Nothing yet",
      reusableLearning: "Still unknown",
      confidence: 0.2,
      epistemic: "UNKNOWN",
      stateFieldsAffected: ["uncertainties"],
    });
    expect(unknown.valid).toBe(false);

    const learning = validateLearning({
      id: "l2",
      sourceExperimentId: "r3",
      whatChanged: "The working hypothesis was falsified",
      reusableLearning: "Prefer testing the alternative explanation",
      confidence: 0.8,
      epistemic: "EXPERIMENTAL",
      stateFieldsAffected: ["uncertainties", "nextActions"],
      resultingActionRef: "task-68-follow-up",
    });
    expect(learning.valid).toBe(true);
  });
});
