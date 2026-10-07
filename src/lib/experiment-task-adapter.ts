import type { ProgrammeEvidenceRef } from "./programme-state";
import type { ExperimentPlan, ExperimentOwner } from "./experiment-engine";
import { validateExperimentPlan } from "./experiment-engine";

export type ExperimentAcceptanceDisposition =
  | "accepted"
  | "rejected"
  | "proposed"
  | "testing";

export interface ProgrammeStateReference {
  stateId: string;
  uncertainty: string;
  evidence: ProgrammeEvidenceRef[];
}

export interface AcceptedExperimentTaskInput {
  taskId: string;
  plan: ExperimentPlan;
  acceptance: ExperimentAcceptanceDisposition;
  state: ProgrammeStateReference;
}

export interface ExperimentTaskEnvelope {
  taskId: string;
  source: "experiment-engine";
  objective: string;
  lane: "IMPLEMENTATION";
  autonomy: "L0" | "L1" | "L2";
  risk: "P0" | "P1" | "P2" | "P3";
  scopeIn: string[];
  scopeOut: string[];
  dependencies: string[];
  acceptanceCriteria: string[];
  invariants: string[];
  evidenceRequired: ProgrammeEvidenceRef[];
  provider: "auto";
  owner: ExperimentOwner;
  requiresHumanGate: boolean;
  reversible: boolean;
  originatingStateId: string;
  originatingUncertainty: string;
  hypothesisId: string;
  experimentId: string;
  procedure: string[];
  inputs: string[];
  expectedObservations: string[];
  failureCriteria: string[];
}

export interface TaskValidation {
  valid: boolean;
  errors: string[];
}

const RISK_MAP: Record<ExperimentPlan["risk"], ExperimentTaskEnvelope["risk"]> = {
  low: "P3",
  medium: "P2",
  high: "P1",
  critical: "P0",
};

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validEvidence(value: unknown): value is ProgrammeEvidenceRef[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        nonEmpty((item as ProgrammeEvidenceRef).id) &&
        nonEmpty((item as ProgrammeEvidenceRef).source),
    )
  );
}

export function experimentTaskRequiresHumanGate(
  plan: Pick<ExperimentPlan, "risk" | "reversible" | "requiresHumanGate">,
): boolean {
  return (
    plan.requiresHumanGate ||
    !plan.reversible ||
    plan.risk === "high" ||
    plan.risk === "critical"
  );
}

export function validateAcceptedExperimentTaskInput(
  input: AcceptedExperimentTaskInput,
): TaskValidation {
  const errors: string[] = [];

  if (!nonEmpty(input.taskId)) errors.push("task id is required");
  if (input.acceptance !== "accepted") {
    errors.push("only explicitly accepted experiments can become tasks");
  }

  const planValidation = validateExperimentPlan(input.plan);
  if (!planValidation.valid) errors.push(...planValidation.errors);

  if (!nonEmpty(input.state.stateId)) errors.push("originating state id is required");
  if (!nonEmpty(input.state.uncertainty)) errors.push("originating uncertainty is required");
  if (!validEvidence(input.state.evidence)) {
    errors.push("originating state evidence must be an array of valid references");
  }

  return { valid: errors.length === 0, errors };
}

export function acceptedExperimentToTask(
  input: AcceptedExperimentTaskInput,
): ExperimentTaskEnvelope {
  const validation = validateAcceptedExperimentTaskInput(input);
  if (!validation.valid) throw new Error(validation.errors.join("; "));

  const requiresHumanGate = experimentTaskRequiresHumanGate(input.plan);

  return {
    taskId: input.taskId,
    source: "experiment-engine",
    objective: input.plan.question,
    lane: "IMPLEMENTATION",
    autonomy: requiresHumanGate ? "L1" : input.plan.owner === "human" ? "L0" : "L2",
    risk: RISK_MAP[input.plan.risk],
    scopeIn: [
      "execute only the bounded experiment procedure",
      "collect only the evidence and observations named by the experiment plan",
      "evaluate against the stated success and failure criteria",
    ],
    scopeOut: [
      "accepting or modifying the experiment plan",
      "mutating ProgrammeState",
      "production changes or external side effects",
      "merge or deploy",
      "provider-specific execution policy",
      "inventing evidence, availability, demand, inventory, learner capability, or external-world facts",
      "creating new discovery, matching, ranking, recommendation, vector, or embedding infrastructure",
    ],
    dependencies: [input.state.stateId, input.plan.hypothesisId],
    acceptanceCriteria: [
      ...input.plan.successCriteria,
      "failure and uncertainty remain explicitly represented when success is not demonstrated",
    ],
    invariants: [
      "hypothesis is not a fact",
      "unknown remains unknown until evidence changes it",
      "experiment evidence must identify its source",
      "irreversible or high/critical-risk work remains human-gated",
      "task translation causes no execution or state mutation",
    ],
    evidenceRequired: input.state.evidence,
    provider: "auto",
    owner: input.plan.owner,
    requiresHumanGate,
    reversible: input.plan.reversible,
    originatingStateId: input.state.stateId,
    originatingUncertainty: input.state.uncertainty,
    hypothesisId: input.plan.hypothesisId,
    experimentId: input.plan.id,
    procedure: [...input.plan.procedure],
    inputs: [...input.plan.inputs],
    expectedObservations: [...input.plan.expectedObservations],
    failureCriteria: [...input.plan.failureCriteria],
  };
}

export function validateExperimentTask(task: ExperimentTaskEnvelope): TaskValidation {
  const errors: string[] = [];
  if (!nonEmpty(task.taskId) || !nonEmpty(task.objective)) {
    errors.push("task identity and objective are required");
  }
  if (task.lane !== "IMPLEMENTATION") {
    errors.push("experiment tasks must use the ordinary implementation lane");
  }
  if (task.provider !== "auto") {
    errors.push("provider selection must remain downstream policy");
  }
  if (!Array.isArray(task.procedure) || task.procedure.length === 0) {
    errors.push("bounded procedure is required");
  }
  if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
    errors.push("acceptance criteria are required");
  }
  if (!validEvidence(task.evidenceRequired)) {
    errors.push("evidence requirements must remain valid references");
  }
  if ((task.risk === "P0" || task.risk === "P1") && !task.requiresHumanGate) {
    errors.push("high-risk and critical tasks require a human gate");
  }
  if (!task.reversible && !task.requiresHumanGate) {
    errors.push("irreversible tasks require a human gate");
  }
  return { valid: errors.length === 0, errors };
}
