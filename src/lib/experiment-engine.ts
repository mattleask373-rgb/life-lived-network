import type {
  ProgrammeEpistemicClass,
  ProgrammeEvidenceRef,
  ProgrammeStateUpdate,
  ProgrammeRiskClass,
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
  "REAL", "PLAUSIBLE", "EXPERIMENTAL", "SPECULATIVE", "IMAGINED", "UNKNOWN",
]);

export function validateHypothesis(value: Hypothesis): Validation {
  const errors: string[] = [];
  if (!value.id || !value.originatingStateId || !value.uncertainty || !value.statement) errors.push("hypothesis identity, uncertainty and statement are required");
  if (!value.falsificationCondition) errors.push("falsification condition is required");
  if (!EPISTEMIC.has(value.epistemic)) errors.push("invalid epistemic class");
  if (!Array.isArray(value.evidence)) errors.push("evidence must be an array");
  return { valid: errors.length === 0, errors };
}

export function experimentRequiresHumanGate(plan: Pick<ExperimentPlan, "risk" | "reversible">): boolean {
  return !plan.reversible || plan.risk === "high" || plan.risk === "critical";
}

export function validateExperimentPlan(value: ExperimentPlan): Validation {
  const errors: string[] = [];
  if (!value.id || !value.hypothesisId || !value.question) errors.push("experiment identity and question are required");
  if (!Array.isArray(value.procedure) || value.procedure.length === 0) errors.push("bounded procedure is required");
  if (!Array.isArray(value.successCriteria) || value.successCriteria.length === 0) errors.push("success criteria are required");
  if (!Array.isArray(value.failureCriteria) || value.failureCriteria.length === 0) errors.push("failure criteria are required");
  if (experimentRequiresHumanGate(value) && !value.requiresHumanGate) errors.push("irreversible or high-risk experiments require a human gate");
  if ((value.risk === "high" || value.risk === "critical") && value.owner === "ai") errors.push("high-risk experiments cannot be autonomous AI-owned");
  return { valid: errors.length === 0, errors };
}

export function resultSupportsClaim(result: ExperimentResult): boolean {
  if (result.outcome !== "supported") return false;
  return result.evidence.length > 0 && result.observations.length > 0 && result.epistemic !== "UNKNOWN";
}

export function preservesUncertainty(result: ExperimentResult): boolean {
  return result.outcome === "inconclusive" || result.outcome === "falsified"
    ? result.followUpUncertainty.length > 0
    : true;
}

export function validateExperimentResult(result: ExperimentResult): Validation {
  const errors: string[] = [];
  if (!result.id || !result.experimentId) errors.push("result identity is required");
  if (!Array.isArray(result.observations)) errors.push("observations must be an array");
  if (!Array.isArray(result.evidence)) errors.push("evidence must be an array");
  if (!Array.isArray(result.followUpUncertainty)) errors.push("follow-up uncertainty must be an array");
  if (result.epistemic === "REAL" && result.evidence.length === 0) errors.push("REAL result requires evidence");
  if (result.outcome === "inconclusive" && result.epistemic === "REAL") errors.push("inconclusive result cannot be classified REAL");
  if (result.outcome === "falsified" && result.epistemic === "REAL") errors.push("falsified result cannot be classified REAL");
  if (!preservesUncertainty(result)) errors.push("inconclusive or falsified results must preserve uncertainty");
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
  if (!stateId || changed.length === 0 || !reason) throw new Error("state update requires state, changed fields and reason");
  return {
    stateId,
    at,
    changed,
    reason,
    evidence: result.evidence,
    epistemic: result.epistemic,
  };
}

export function validateLearning(record: LearningRecord): Validation {
  const errors: string[] = [];
  if (!record.id || !record.sourceExperimentId || !record.whatChanged || !record.reusableLearning) errors.push("learning identity and content are required");
  if (record.confidence < 0 || record.confidence > 1) errors.push("confidence must be between 0 and 1");
  if (record.epistemic === "REAL" && record.confidence <= 0) errors.push("REAL learning requires positive confidence");
  if (record.stateFieldsAffected.length === 0) errors.push("learning must identify affected state fields");
  return { valid: errors.length === 0, errors };
}
