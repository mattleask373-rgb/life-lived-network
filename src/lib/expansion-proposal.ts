/**
 * Expansion Proposal kernel — AI-NATIVE-01 / Issue #65
 *
 * Pure, provider-neutral contract for proposing new mechanisms when the
 * current category/workflow appears insufficient.
 *
 * DOES NOT: execute, auto-accept, mutate production, create a second matcher,
 * invent external facts, or grant autonomous merge/deploy authority.
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
  locator?: string;
}

export interface ExpansionProposal {
  id: string;
  originatingObjective: string;
  originatingTaskId?: string;
  observedPattern: string;
  evidence: ExpansionEvidenceRef[];
  proposedCategory: string;
  currentCategory: string;
  limitation: string;
  proposedMechanism: string;
  expectedLeverage: string;
  alternativesConsidered: string[];
  experimentPlan: string;
  falsificationCondition: string;
  reversible: boolean;
  risk: ExpansionRisk;
  requiresHumanGate: boolean;
  epistemic: ExpansionEpistemic;
  status: ExpansionStatus;
  resultingTaskId?: string;
}

export interface ExpansionValidation {
  valid: boolean;
  errors: string[];
}

export interface ExpansionOverlap {
  proposalId: string;
  overlap: "exact" | "category" | "objective";
  reason: string;
}

const EPISTEMIC = new Set<ExpansionEpistemic>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);

const STATUS = new Set<ExpansionStatus>([
  "proposed",
  "testing",
  "accepted",
  "rejected",
  "superseded",
]);

const RISKS = new Set<ExpansionRisk>(["low", "medium", "high", "critical"]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validEvidence(value: unknown): value is ExpansionEvidenceRef[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        nonEmpty((item as ExpansionEvidenceRef).id) &&
        nonEmpty((item as ExpansionEvidenceRef).source),
    )
  );
}

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function requiresHumanGate(
  proposal: Pick<ExpansionProposal, "risk" | "reversible">,
): boolean {
  return !proposal.reversible || proposal.risk === "high" || proposal.risk === "critical";
}

/** @deprecated use requiresHumanGate */
export function expansionRequiresHumanGate(
  proposal: Pick<ExpansionProposal, "risk" | "reversible">,
): boolean {
  return requiresHumanGate(proposal);
}

export function validateExpansionProposal(proposal: ExpansionProposal): ExpansionValidation {
  const errors: string[] = [];

  if (!nonEmpty(proposal.id)) errors.push("proposal id is required");
  if (!nonEmpty(proposal.originatingObjective)) errors.push("originating objective is required");
  if (!nonEmpty(proposal.observedPattern)) errors.push("observed pattern is required");
  if (!nonEmpty(proposal.proposedCategory)) errors.push("proposed category is required");
  if (!nonEmpty(proposal.currentCategory)) errors.push("current category is required");
  if (!nonEmpty(proposal.limitation)) errors.push("limitation is required");
  if (!nonEmpty(proposal.proposedMechanism)) errors.push("proposed mechanism is required");
  if (!nonEmpty(proposal.expectedLeverage)) errors.push("expected leverage is required");
  if (!nonEmpty(proposal.experimentPlan)) errors.push("experiment plan is required");
  if (!nonEmpty(proposal.falsificationCondition))
    errors.push("falsification condition is required");

  if (!validEvidence(proposal.evidence)) {
    errors.push("evidence must be an array of valid references");
  }
  if (!Array.isArray(proposal.alternativesConsidered)) {
    errors.push("alternatives considered must be an array");
  }
  if (!EPISTEMIC.has(proposal.epistemic)) errors.push("invalid epistemic class");
  if (!STATUS.has(proposal.status)) errors.push("invalid status");
  if (!RISKS.has(proposal.risk)) errors.push("invalid risk class");
  if (typeof proposal.reversible !== "boolean") errors.push("reversibility must be explicit");
  if (typeof proposal.requiresHumanGate !== "boolean")
    errors.push("human-gate requirement must be explicit");

  if (proposal.epistemic === "REAL") {
    errors.push("a proposal cannot be classified REAL; proposals are not facts");
  }
  if (proposal.epistemic === "UNKNOWN" && proposal.status === "accepted") {
    errors.push("UNKNOWN proposals cannot be accepted without evidence upgrade");
  }
  if (proposal.epistemic === "IMAGINED" && proposal.status === "accepted") {
    errors.push("IMAGINED proposals cannot be accepted without evidence upgrade");
  }
  if (requiresHumanGate(proposal) && !proposal.requiresHumanGate) {
    errors.push("irreversible or high/critical-risk proposals require a human gate");
  }
  if (proposal.status === "accepted" && !nonEmpty(proposal.resultingTaskId ?? "")) {
    errors.push("accepted proposals must reference a resulting bounded task");
  }
  if (proposal.status !== "accepted" && nonEmpty(proposal.resultingTaskId ?? "")) {
    errors.push("resulting task may only be attached when status is accepted");
  }

  return { valid: errors.length === 0, errors };
}

export function createExpansionProposal(
  input: Omit<ExpansionProposal, "status" | "requiresHumanGate"> & {
    status?: ExpansionStatus;
    requiresHumanGate?: boolean;
  },
): ExpansionProposal {
  const requiresGate =
    input.requiresHumanGate ?? requiresHumanGate({ risk: input.risk, reversible: input.reversible });
  return {
    ...input,
    status: input.status ?? "proposed",
    requiresHumanGate: requiresGate,
  };
}

export function findExpansionOverlaps(
  candidate: ExpansionProposal,
  existing: ExpansionProposal[],
): ExpansionOverlap[] {
  const overlaps: ExpansionOverlap[] = [];
  const candMech = norm(candidate.proposedMechanism);
  const candCat = norm(candidate.proposedCategory);
  const candObj = norm(candidate.originatingObjective);

  for (const p of existing) {
    if (p.id === candidate.id) continue;
    if (p.status === "rejected" || p.status === "superseded") continue;

    const sameMech = norm(p.proposedMechanism) === candMech;
    const sameCat = norm(p.proposedCategory) === candCat;
    const sameObj = norm(p.originatingObjective) === candObj;

    if (sameMech && sameCat) {
      overlaps.push({
        proposalId: p.id,
        overlap: "exact",
        reason: "same proposed category and mechanism",
      });
    } else if (sameCat) {
      overlaps.push({
        proposalId: p.id,
        overlap: "category",
        reason: "same proposed category",
      });
    }
    if (sameObj && !sameMech) {
      overlaps.push({
        proposalId: p.id,
        overlap: "objective",
        reason: "same originating objective",
      });
    }
  }
  return overlaps;
}

export function canPromoteToAccepted(proposal: ExpansionProposal): ExpansionValidation {
  const errors: string[] = [];
  if (proposal.status !== "testing") {
    errors.push("only proposals in testing may be promoted to accepted");
  }
  if (proposal.epistemic === "UNKNOWN" || proposal.epistemic === "IMAGINED") {
    errors.push("epistemic class must be upgraded before acceptance");
  }
  if (proposal.epistemic === "REAL") {
    errors.push("a proposal cannot be classified REAL");
  }
  if (!validEvidence(proposal.evidence) || proposal.evidence.length === 0) {
    errors.push("acceptance requires evidence");
  }
  return { valid: errors.length === 0, errors };
}
