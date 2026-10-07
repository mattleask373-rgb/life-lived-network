import type {
  ProgrammeEpistemicClass,
  ProgrammeEvidenceRef,
  ProgrammeRiskClass,
  ProgrammeStateUpdate,
} from "./programme-state";

export type ExperimentOutcome = "supported" | "weakened" | "falsified" | "inconclusive";
export type ExperimentOwner = "human" | "ai" | "human_ai" | "software";

export interface Hypothesis {
  id: string;
  originatingStateId: string;
  uncertainty: string;
  statement: string;
  evidence: ProgrammeEvidenceRef[];
  epistemic: ProgrammeEpistemicClass;
  falsificationCondition: string;
}

export interface ExperimentPlan {
  id: string;
  hypothesisId: string;
  question: string;
  procedure: string[];
  inputs: string[];
  expectedObservations: string[];
  successCriteria: string[];
  failureCriteria: string[];
  reversible: boolean;
  risk: ProgrammeRiskClass;
  requiresHumanGate: boolean;
  owner: ExperimentOwner;
}

export interface ExperimentResult {
  id: string;
  experimentId: string;
  observations: string[];
  outcome: ExperimentOutcome;
  evidence: ProgrammeEvidenceRef[];
  epistemic: ProgrammeEpistemicClass;
  limitations: string[];
  followUpUncertainty: string[];
}

export interface LearningRecord {
  id: string;
  sourceExperimentId: string;
  whatChanged: string;
  reusableLearning: string;
  confidence: number;
  epistemic: ProgrammeEpistemicClass;
  stateFieldsAffected: string[];
  resultingActionRef?: string;
}

export interface Validation {
  valid: boolean;
  errors: string[];
}

const EPISTEMIC = new Set<ProgrammeEpistemicClass>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);
const RISKS = new Set<ProgrammeRiskClass>(["low", "medium", "high", "critical"]);
const OWNERS = new Set<ExperimentOwner>(["human", "ai", "human_ai", "software"]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validEvidence(value: unknown): value is ProgrammeEvidenceRef[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const evidence = item as ProgrammeEvidenceRef;
      return nonEmpty(evidence.id) && nonEmpty(evidence.source);
    })
  );
}

function validEpistemic(value: unknown): value is ProgrammeEpistemicClass {
  return typeof value === "string" && EPISTEMIC.has(value as ProgrammeEpistemicClass);
}

export function validateHypothesis(value: Hypothesis): Validation {
  const errors: string[] = [];
  if (
    !nonEmpty(value.id) ||
    !nonEmpty(value.originatingStateId) ||
    !nonEmpty(value.uncertainty) ||
    !nonEmpty(value.statement)
  ) {
    errors.push("hypothesis identity, uncertainty and statement are required");
  }
  if (!nonEmpty(value.falsificationCondition)) {
    errors.push("falsification condition is required");
  }
  if (!validEpistemic(value.epistemic)) errors.push("invalid epistemic class");
  if (!validEvidence(value.evidence)) errors.push("evidence must be an array of valid references");
  if (value.epistemic === "REAL") errors.push("a hypothesis cannot be asserted as REAL");
  return { valid: errors.length === 0, errors };
}

export function experimentRequiresHumanGate(
  plan: Pick<ExperimentPlan, "risk" | "reversible">,
): boolean {
  return !plan.reversible || plan.risk === "high" || plan.risk === "critical";
}

export function validateExperimentPlan(value: ExperimentPlan): Validation {
  const errors: string[] = [];
  if (!nonEmpty(value.id) || !nonEmpty(value.hypothesisId) || !nonEmpty(value.question)) {
    errors.push("experiment identity and question are required");
  }
  if (
    !Array.isArray(value.procedure) ||
    value.procedure.length === 0 ||
    !value.procedure.every(nonEmpty)
  ) {
    errors.push("bounded procedure is required");
  }
  if (!Array.isArray(value.inputs) || !value.inputs.every(nonEmpty)) {
    errors.push("inputs must be an array of strings");
  }
  if (!Array.isArray(value.expectedObservations) || !value.expectedObservations.every(nonEmpty)) {
    errors.push("expected observations must be an array of strings");
  }
  if (
    !Array.isArray(value.successCriteria) ||
    value.successCriteria.length === 0 ||
    !value.successCriteria.every(nonEmpty)
  ) {
    errors.push("success criteria are required");
  }
  if (
    !Array.isArray(value.failureCriteria) ||
    value.failureCriteria.length === 0 ||
    !value.failureCriteria.every(nonEmpty)
  ) {
    errors.push("failure criteria are required");
  }
  if (!RISKS.has(value.risk)) errors.push("invalid risk class");
  if (!OWNERS.has(value.owner)) errors.push("invalid experiment owner");
  if (typeof value.reversible !== "boolean") errors.push("reversibility must be explicit");
  if (typeof value.requiresHumanGate !== "boolean")
    errors.push("human-gate requirement must be explicit");
  if (experimentRequiresHumanGate(value) && !value.requiresHumanGate) {
    errors.push("irreversible or high-risk experiments require a human gate");
  }
  if ((value.risk === "high" || value.risk === "critical") && value.owner === "ai") {
    errors.push("high-risk experiments cannot be autonomous AI-owned");
  }
  return { valid: errors.length === 0, errors };
}

export function resultSupportsClaim(result: ExperimentResult): boolean {
  return (
    result.outcome === "supported" &&
    result.evidence.length > 0 &&
    result.observations.length > 0 &&
    result.epistemic !== "UNKNOWN"
  );
}

export function preservesUncertainty(result: ExperimentResult): boolean {
  return result.outcome === "inconclusive" || result.outcome === "falsified"
    ? result.followUpUncertainty.length > 0
    : true;
}

export function validateExperimentResult(result: ExperimentResult): Validation {
  const errors: string[] = [];
  if (!nonEmpty(result.id) || !nonEmpty(result.experimentId))
    errors.push("result identity is required");
  if (!Array.isArray(result.observations) || !result.observations.every(nonEmpty)) {
    errors.push("observations must be an array of strings");
  }
  if (!validEvidence(result.evidence)) errors.push("evidence must be an array of valid references");
  if (!Array.isArray(result.limitations) || !result.limitations.every(nonEmpty)) {
    errors.push("limitations must be an array of strings");
  }
  if (!Array.isArray(result.followUpUncertainty) || !result.followUpUncertainty.every(nonEmpty)) {
    errors.push("follow-up uncertainty must be an array of strings");
  }
  if (!["supported", "weakened", "falsified", "inconclusive"].includes(result.outcome)) {
    errors.push("invalid experiment outcome");
  }
  if (!validEpistemic(result.epistemic)) errors.push("invalid epistemic class");
  if (result.epistemic === "REAL" && result.evidence.length === 0)
    errors.push("REAL result requires evidence");
  if (result.outcome === "inconclusive" && result.epistemic === "REAL")
    errors.push("inconclusive result cannot be classified REAL");
  if (result.outcome === "falsified" && result.epistemic === "REAL")
    errors.push("falsified result cannot be classified REAL");
  if (result.outcome === "supported" && !resultSupportsClaim(result)) {
    errors.push(
      "supported result requires observations, evidence and a non-UNKNOWN epistemic class",
    );
  }
  if (!preservesUncertainty(result))
    errors.push("inconclusive or falsified results must preserve uncertainty");
  return { valid: errors.length === 0, errors };
}

export function toProgrammeStateUpdate(
  stateId: string,
  result: ExperimentResult,
  changed: string[],
  reason: string,
  at: string,
): ProgrammeStateUpdate {
  const validation = validateExperimentResult(result);
  if (!validation.valid) throw new Error(validation.errors.join("; "));
  if (!nonEmpty(stateId) || changed.length === 0 || !nonEmpty(reason)) {
    throw new Error("state update requires state, changed fields and reason");
  }
  if (!nonEmpty(at) || Number.isNaN(Date.parse(at))
    throw new Error("state update requires a valid timestamp");
  return { stateId, at, changed, reason, evidence: result.evidence, epistemic: result.epistemic };
}

export function validateLearning(record: LearningRecord): Validation {
  const errors: string[] = [];
  if (
    !nonEmpty(record.id) ||
    !nonEmpty(record.sourceExperimentId) ||
    !nonEmpty(record.whatChanged) ||
    !nonEmpty(record.reusableLearning)
  ) {
    errors.push("learning identity and content are required");
  }
  if (!Number.isFinite(record.confidence) || record.confidence < 0 || record.confidence > 1) {
    errors.push("confidence must be a finite number between 0 and 1");
  }
  if (!validEpistemic(record.epistemic)) errors.push("invalid epistemic class");
  if (record.epistemic === "UNKNOWN" && record.confidence > 0)
    errors.push("UNKNOWN learning cannot carry positive confidence");
  if (
    !Array.isArray(record.stateFieldsAffected) ||
    record.stateFieldsAffected.length === 0 ||
    !record.stateFieldsAffected.every(nonEmpty)
  ) {
    errors.push("learning must identify affected state fields");
  }
  if (record.epistemic === "REAL" && record.confidence <= 0)
    errors.push("REAL learning requires positive confidence");
  return { valid: errors.length === 0, errors };
}
