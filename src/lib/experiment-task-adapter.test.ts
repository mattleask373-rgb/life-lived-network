import { describe, expect, it } from "vitest";

import {
  acceptedExperimentToTask,
  experimentTaskRequiresHumanGate,
  validateAcceptedExperimentTaskInput,
  validateExperimentTask,
  type AcceptedExperimentTaskInput,
} from "./experiment-task-adapter";

const evidence = [{ id: "e1", source: "programme-state", locator: "state:1" }];

function input(
  overrides: Partial<AcceptedExperimentTaskInput> = {},
): AcceptedExperimentTaskInput {
  return {
    taskId: "LW-20261007-EXP-001",
    acceptance: "accepted",
    state: {
      stateId: "state-1",
      uncertainty: "We do not know whether this workflow reduces friction.",
      evidence,
    },
    plan: {
      id: "experiment-1",
      hypothesisId: "hypothesis-1",
      question: "Does the bounded workflow reduce friction?",
      procedure: ["Run the existing workflow with a fixed test input"],
      inputs: ["one fixed test input"],
      expectedObservations: ["record completion time"],
      successCriteria: ["completion time decreases against the stated baseline"],
      failureCriteria: ["no improvement or regression"],
      reversible: true,
      risk: "low",
      requiresHumanGate: false,
      owner: "human_ai",
    },
    ...overrides,
  };
}

describe("experiment-task-adapter", () => {
  it("rejects unaccepted experiments", () => {
    const validation = validateAcceptedExperimentTaskInput(
      input({ acceptance: "proposed" }),
    );
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain(
      "only explicitly accepted experiments can become tasks",
    );
  });

  it("translates an accepted reversible low-risk plan without inventing execution", () => {
    const task = acceptedExperimentToTask(input());

    expect(task.taskId).toBe("LW-20261007-EXP-001");
    expect(task.source).toBe("experiment-engine");
    expect(task.lane).toBe("IMPLEMENTATION");
    expect(task.provider).toBe("auto");
    expect(task.originatingStateId).toBe("state-1");
    expect(task.originatingUncertainty).toContain("do not know");
    expect(task.hypothesisId).toBe("hypothesis-1");
    expect(task.experimentId).toBe("experiment-1");
    expect(task.evidenceRequired).toEqual(evidence);
    expect(task.requiresHumanGate).toBe(false);
    expect(validateExperimentTask(task).valid).toBe(true);
  });

  it("preserves a human gate for high-risk experiments", () => {
    const task = acceptedExperimentToTask(
      input({
        plan: {
          ...input().plan,
          risk: "high",
          requiresHumanGate: true,
        },
      }),
    );

    expect(task.requiresHumanGate).toBe(true);
    expect(task.autonomy).toBe("L1");
    expect(task.risk).toBe("P1");
  });

  it("preserves a human gate for irreversible experiments", () => {
    const plan = {
      ...input().plan,
      reversible: false,
      requiresHumanGate: true,
    };
    expect(experimentTaskRequiresHumanGate(plan)).toBe(true);
    expect(acceptedExperimentToTask(input({ plan })).requiresHumanGate).toBe(true);
  });

  it("rejects a plan that claims irreversible work is ungated", () => {
    const invalid = input({
      plan: {
        ...input().plan,
        reversible: false,
        requiresHumanGate: false,
      },
    });
    const validation = validateAcceptedExperimentTaskInput(invalid);
    expect(validation.valid).toBe(false);
  });

  it("does not mutate ProgrammeState or the source plan", () => {
    const original = input();
    const before = JSON.stringify(original);
    acceptedExperimentToTask(original);
    expect(JSON.stringify(original)).toBe(before);
  });
});
