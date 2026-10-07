/**
 * Expansion Proposal kernel — AI-NATIVE-01
 *
 * Pure, provider-neutral contract for proposing new mechanisms when the
 * current category/workflow appears insufficient.
 *
 * DOES NOT: execute, auto-accept, mutate production, create a second matcher,
 * invent external facts, or grant autonomous merge/deploy authority.
 *
 * Acceptance produces an ordinary bounded task candidate only.
 */

export type ExpansionEpistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type ExpansionStatus = "proposed" | "testing" | "accepted" | "rejected" | "superseded";

export type ExpansionRisk = "low" | "medium" | "high" | "critical";

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
  resultingTaskRef?: string;
}

export interface ExpansionValidation {
  valid: boolean;
  errors: string[];
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

export function expansionRequiresHumanGate(
  proposal: Pick<ExpansionProposal, "risk" | "reversible">,
): boolean {
  return !proposal.reversible || proposal.risk === "high" || proposal.risk === "critical";
}

/**
 * A proposal cannot claim REAL status — proposals are not facts.
 * REAL evidence may support PLAUSIBLE or EXPERIMENTAL classification.
 */
export function validateExpansionProposal(proposal: ExpansionProposal): ExpansionValidation {
  const errors: string[] = [];

  if (!nonEmpty(proposal.id)) errors.push("proposal id is required");
  if (!nonEmpty(proposal.originatingObjective)) errors.push("originating objective is required");
  if (!nonEmpty(proposal.observedPattern)) errors.push("observed pattern is required");
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
  if (expansionRequiresHumanGate(proposal) && !proposal.requiresHumanGate) {
    errors.push("irreversible or high/critical-risk proposals require a human gate");
  }
  if (proposal.status === "accepted" && !nonEmpty(proposal.resultingTaskRef)) {
    errors.push("accepted proposals must reference a resulting bounded task");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detect overlapping proposals by normalised mechanism + limitation text.
 * Not a discovery/matcher engine — pure string overlap over a supplied list.
 */
export function findOverlappingProposals(
  candidate: ExpansionProposal,
  existing: ExpansionProposal[],
): ExpansionProposal[] {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const mech = norm(candidate.proposedMechanism);
  const lim = norm(candidate.limitation);
  return existing.filter((p) => {
    if (p.id === candidate.id) return false;
    if (p.status === "rejected" || p.status === "superseded") return false;
    return norm(p.proposedMechanism) === mech || norm(p.limitation) === lim;
  });
}

/**
 * Convert an explicitly accepted proposal into an ordinary bounded task sketch.
 * Does not execute, persist, or claim anything.
 */
export function acceptedProposalToTaskSketch(proposal: ExpansionProposal): {
  ok: boolean;
  reason: string;
  sketch?: {
    objective: string;
    scopeIn: string[];
    scopeOut: string[];
    risk: ExpansionRisk;
    requiresHumanGate: boolean;
    evidence: ExpansionEvidenceRef[];
    proposalId: string;
  };
} {
  if (proposal.status !== "accepted") {
    return { ok: false, reason: "only accepted proposals can become task sketches" };
  }
  const validation = validateExpansionProposal(proposal);
  if (!validation.valid) {
    return { ok: false, reason: validation.errors.join("; ") };
  }
  return {
    ok: true,
    reason: "task sketch ready",
    sketch: {
      objective: proposal.proposedMechanism,
      scopeIn: [
        "implement only the bounded experiment named by the proposal",
        "collect evidence against the falsification condition",
      ],
      scopeOut: [
        "auto-accepting further self-modification",
        "mutating production without human gate",
        "creating a second discovery/matcher engine",
        "inventing external-world facts",
      ],
      risk: proposal.risk,
      requiresHumanGate: proposal.requiresHumanGate,
      evidence: proposal.evidence,
      proposalId: proposal.id,
    },
  };
}

export function classifyEvidenceCompleteness(
  proposal: Pick<ExpansionProposal, "evidence" | "epistemic">,
): "empty" | "minimal" | "substantial" {
  const n = proposal.evidence.length;
  if (n === 0) return "empty";
  if (n < 3) return "minimal";
  return "substantial";
}
