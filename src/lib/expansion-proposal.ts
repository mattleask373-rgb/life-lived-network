/**
 * Bounded possibility/expansion proposal kernel.
 *
 * This module records when an observed pattern may not fit the current
 * category or mechanism without treating the proposal as fact or granting
 * it self-modification authority.
 *
 * Pure and provider-neutral. It does not execute work, mutate production
 * state, select providers, rank supply, or replace findSupply().
 */

export type ExpansionEpistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type ExpansionRisk = "low" | "medium" | "high" | "critical";
export type ExpansionStatus = "proposed" | "testing" | "accepted" | "rejected" | "superseded";

export interface ExpansionEvidenceRef {
  id: string;
  source: string;
  note?: string;
}

export interface ExpansionProposal {
  id: string;
  originatingObjective: string;
  originatingTask?: string;
  observedPattern: string;
  evidence: ExpansionEvidenceRef[];
  currentCategory: string;
  currentMechanism: string;
  limitation: string;
  proposedCategory: string;
  proposedMechanism: string;
  expectedLeverage: string[];
  affectedCapabilities: string[];
  alternativesConsidered: string[];
  experimentPlan: string[];
  falsificationCriteria: string[];
  reversible: boolean;
  risk: ExpansionRisk;
  requiresHumanGate: boolean;
  epistemic: ExpansionEpistemic;
  status: ExpansionStatus;
  resultingTaskId?: string;
  supersedesProposalId?: string;
}

export interface ExpansionValidation {
  valid: boolean;
  errors: string[];
}

export interface ExpansionOverlap {
  proposalId: string;
  overlap: "exact" | "category" | "mechanism" | "objective";
  reason: string;
}

const EPISTEMICS = new Set<ExpansionEpistemic>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);
const RISKS = new Set<ExpansionRisk>(["low", "medium", "high", "critical"]);
const STATUSES = new Set<ExpansionStatus>([
  "proposed",
  "testing",
  "accepted",
  "rejected",
  "superseded",
]);

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const nonEmptyList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(nonEmpty);

const validEvidence = (value: unknown): value is ExpansionEvidenceRef[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      Boolean(item) &&
      typeof item === "object" &&
      nonEmpty((item as ExpansionEvidenceRef).id) &&
      nonEmpty((item as ExpansionEvidenceRef).source),
  );

export function requiresHumanGate(
  proposal: Pick<ExpansionProposal, "risk" | "reversible">,
): boolean {
  return proposal.risk === "high" || proposal.risk === "critical" || !proposal.reversible;
}

export function validateExpansionProposal(
  proposal: unknown,
): ExpansionValidation {
  const errors: string[] = [];

  if (!proposal || typeof proposal !== "object") {
    return { valid: false, errors: ["proposal must be an object"] };
  }

  const candidate = proposal as ExpansionProposal;

  if (!nonEmpty(candidate.id)) errors.push("id is required");
  if (!nonEmpty(candidate.originatingObjective)) errors.push("originatingObjective is required");
  if (!nonEmpty(candidate.observedPattern)) errors.push("observedPattern is required");
  if (!validEvidence(candidate.evidence)) errors.push("evidence must contain valid references");
  if (!nonEmpty(candidate.currentCategory)) errors.push("currentCategory is required");
  if (!nonEmpty(candidate.currentMechanism)) errors.push("currentMechanism is required");
  if (!nonEmpty(candidate.limitation)) errors.push("limitation is required");
  if (!nonEmpty(candidate.proposedCategory)) errors.push("proposedCategory is required");
  if (!nonEmpty(candidate.proposedMechanism)) errors.push("proposedMechanism is required");
  if (!nonEmptyList(candidate.expectedLeverage)) errors.push("expectedLeverage is required");
  if (!nonEmptyList(candidate.affectedCapabilities)) errors.push("affectedCapabilities is required");
  if (!nonEmptyList(candidate.alternativesConsidered)) errors.push("alternativesConsidered is required");
  if (!nonEmptyList(candidate.experimentPlan)) errors.push("experimentPlan is required");
  if (!nonEmptyList(candidate.falsificationCriteria)) errors.push("falsificationCriteria is required");
  if (!EPISTEMICS.has(candidate.epistemic)) errors.push("epistemic classification is invalid");
  if (!RISKS.has(candidate.risk)) errors.push("risk classification is invalid");
  if (!STATUSES.has(candidate.status)) errors.push("status is invalid");
  if (typeof candidate.reversible !== "boolean") errors.push("reversible is required");
  if (typeof candidate.requiresHumanGate !== "boolean") errors.push("requiresHumanGate is required");

  if (candidate.epistemic === "REAL" && candidate.evidence.length === 0) {
    errors.push("REAL proposals require evidence");
  }
  if (candidate.epistemic === "UNKNOWN" && candidate.status === "accepted") {
    errors.push("UNKNOWN proposals cannot be accepted");
  }
  if (requiresHumanGate(candidate) && !candidate.requiresHumanGate) {
    errors.push("high/critical-risk or irreversible proposals require a human gate");
  }
  if (candidate.status === "accepted" && !candidate.resultingTaskId) {
    errors.push("accepted proposals require a resulting bounded task reference");
  }
  if (candidate.resultingTaskId && candidate.status !== "accepted") {
    errors.push("resultingTaskId is only valid for accepted proposals");
  }

  return { valid: errors.length === 0, errors };
}

export function createExpansionProposal(
  proposal: ExpansionProposal,
): ExpansionProposal {
  const validation = validateExpansionProposal(proposal);
  if (!validation.valid) {
    throw new Error("Invalid expansion proposal: " + validation.errors.join("; "));
  }
  return {
    ...proposal,
    evidence: proposal.evidence.map((item) => ({ ...item })),
    expectedLeverage: [...proposal.expectedLeverage],
    affectedCapabilities: [...proposal.affectedCapabilities],
    alternativesConsidered: [...proposal.alternativesConsidered],
    experimentPlan: [...proposal.experimentPlan],
    falsificationCriteria: [...proposal.falsificationCriteria],
  };
}

export function findExpansionOverlaps(
  candidate: ExpansionProposal,
  existing: ExpansionProposal[],
): ExpansionOverlap[] {
  const overlaps: ExpansionOverlap[] = [];

  for (const proposal of existing) {
    if (proposal.id === candidate.id) continue;

    if (
      proposal.proposedCategory.trim().toLowerCase() ===
        candidate.proposedCategory.trim().toLowerCase() &&
      proposal.proposedMechanism.trim().toLowerCase() ===
        candidate.proposedMechanism.trim().toLowerCase()
    ) {
      overlaps.push({
        proposalId: proposal.id,
        overlap: "exact",
        reason: "same proposed category and mechanism",
      });
      continue;
    }

    if (
      proposal.proposedCategory.trim().toLowerCase() ===
      candidate.proposedCategory.trim().toLowerCase()
    ) {
      overlaps.push({
        proposalId: proposal.id,
        overlap: "category",
        reason: "same proposed category",
      });
    }

    if (
      proposal.proposedMechanism.trim().toLowerCase() ===
      candidate.proposedMechanism.trim().toLowerCase()
    ) {
      overlaps.push({
        proposalId: proposal.id,
        overlap: "mechanism",
        reason: "same proposed mechanism",
      });
    }

    if (
      proposal.originatingObjective.trim().toLowerCase() ===
      candidate.originatingObjective.trim().toLowerCase()
    ) {
      overlaps.push({
        proposalId: proposal.id,
        overlap: "objective",
        reason: "same originating objective",
      });
    }
  }

  return overlaps;
}

export function canPromoteToAccepted(
  proposal: ExpansionProposal,
): ExpansionValidation {
  const validation = validateExpansionProposal(proposal);
  if (!validation.valid) return validation;
  if (proposal.status !== "testing") {
    return { valid: false, errors: ["only a testing proposal can be promoted to accepted"] };
  }
  if (proposal.epistemic === "UNKNOWN" || proposal.epistemic === "IMAGINED") {
    return {
      valid: false,
      errors: ["UNKNOWN or IMAGINED proposals require evidence-backed testing before acceptance"],
    };
  }
  if (requiresHumanGate(proposal) && !proposal.requiresHumanGate) {
    return { valid: false, errors: ["promotion requires a human gate"] };
  }
  return { valid: true, errors: [] };
}
