/**
 * Bounded, provider-neutral Programme OS state.
 *
 * This module is deliberately descriptive rather than inferential: it stores
 * what the programme currently knows, what it does not know, and the bounded
 * next action proposed from that state. It is not a matcher, recommender,
 * learner profiler, graph database, or autonomous execution engine.
 */

export type ProgrammeEpistemicClass =
  "REAL" | "PLAUSIBLE" | "EXPERIMENTAL" | "SPECULATIVE" | "IMAGINED" | "UNKNOWN";

export type ProgrammeStateStatus = "active" | "blocked" | "awaiting_human" | "complete";
export type ProgrammeRiskClass = "low" | "medium" | "high" | "critical";

export interface ProgrammeEvidenceRef {
  id: string;
  source: string;
  capturedAt?: string;
  note?: string;
}

export interface ProgrammeClaim {
  text: string;
  epistemic: ProgrammeEpistemicClass;
  evidence: ProgrammeEvidenceRef[];
  confidence?: number;
  uncertainty?: string[];
}

export interface ProgrammeObjective {
  id: string;
  statement: string;
  constraints: string[];
  values?: string[];
}

export interface ProgrammeProjectState {
  projectId: string;
  status: ProgrammeStateStatus;
  summary: string;
  completed: string[];
  active: string[];
  blocked: string[];
}

export interface ProgrammeCapabilityNeed {
  capability: string;
  need: "existing" | "missing" | "emerging" | "unknown";
  evidence: ProgrammeEvidenceRef[];
  reason: string;
}

export interface ProgrammeFrontierSignal {
  id: string;
  statement: string;
  epistemic: ProgrammeEpistemicClass;
  evidence: ProgrammeEvidenceRef[];
  implication: string;
}

export interface ProgrammeNextAction {
  id: string;
  statement: string;
  bounded: true;
  owner: "human" | "ai" | "human_ai" | "software";
  risk: ProgrammeRiskClass;
  requiresHumanGate: boolean;
  acceptance: string[];
}

export interface ProgrammeState {
  version: 1;
  stateId: string;
  updatedAt: string;
  objective: ProgrammeObjective;
  project: ProgrammeProjectState;
  capabilityNeeds: ProgrammeCapabilityNeed[];
  frontierSignals: ProgrammeFrontierSignal[];
  claims: ProgrammeClaim[];
  uncertainties: string[];
  nextActions: ProgrammeNextAction[];
  status: ProgrammeStateStatus;
}

export interface ProgrammeStateUpdate {
  stateId: string;
  at: string;
  changed: string[];
  reason: string;
  evidence: ProgrammeEvidenceRef[];
  epistemic: ProgrammeEpistemicClass;
}

export interface ProgrammeStateValidation {
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
const STATUSES = new Set<ProgrammeStateStatus>(["active", "blocked", "awaiting_human", "complete"]);
const RISKS = new Set<ProgrammeRiskClass>(["low", "medium", "high", "critical"]);

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

function validClaim(value: unknown): value is ProgrammeClaim {
  if (!value || typeof value !== "object") return false;
  const claim = value as ProgrammeClaim;
  return (
    nonEmpty(claim.text) &&
    validEpistemic(claim.epistemic) &&
    validEvidence(claim.evidence) &&
    (claim.confidence === undefined ||
      (typeof claim.confidence === "number" && claim.confidence >= 0 && claim.confidence <= 1)) &&
    (claim.uncertainty === undefined ||
      (Array.isArray(claim.uncertainty) && claim.uncertainty.every(nonEmpty)))
  );
}

function validNextAction(value: unknown): value is ProgrammeNextAction {
  if (!value || typeof value !== "object") return false;
  const action = value as ProgrammeNextAction;
  return (
    nonEmpty(action.id) &&
    nonEmpty(action.statement) &&
    action.bounded === true &&
    ["human", "ai", "human_ai", "software"].includes(action.owner) &&
    typeof action.requiresHumanGate === "boolean" &&
    RISKS.has(action.risk) &&
    Array.isArray(action.acceptance) &&
    action.acceptance.length > 0 &&
    action.acceptance.every(nonEmpty)
  );
}

export function validateProgrammeState(state: unknown): ProgrammeStateValidation {
  const errors: string[] = [];
  if (!state || typeof state !== "object")
    return { valid: false, errors: ["state must be an object"] };
  const candidate = state as ProgrammeState;

  if (candidate.version !== 1) errors.push("version must be 1");
  if (!nonEmpty(candidate.stateId)) errors.push("stateId is required");
  if (!nonEmpty(candidate.updatedAt) || Number.isNaN(Date.parse(candidate.updatedAt))) {
    errors.push("updatedAt must be an ISO date");
  }
  if (
    !candidate.objective ||
    !nonEmpty(candidate.objective.id) ||
    !nonEmpty(candidate.objective.statement)
  ) {
    errors.push("objective requires id and statement");
  }
  if (
    !candidate.project ||
    !nonEmpty(candidate.project.projectId) ||
    !STATUSES.has(candidate.project.status)
  ) {
    errors.push("project requires projectId and valid status");
  }
  if (!Array.isArray(candidate.capabilityNeeds)) errors.push("capabilityNeeds must be an array");
  if (!Array.isArray(candidate.frontierSignals)) errors.push("frontierSignals must be an array");
  if (!Array.isArray(candidate.claims) || !candidate.claims.every(validClaim)) {
    errors.push("claims must contain valid epistemically-classified claims");
  }
  if (!Array.isArray(candidate.uncertainties) || !candidate.uncertainties.every(nonEmpty)) {
    errors.push("uncertainties must be an array of strings");
  }
  if (!Array.isArray(candidate.nextActions) || !candidate.nextActions.every(validNextAction)) {
    errors.push("nextActions must contain bounded valid actions");
  }
  if (!STATUSES.has(candidate.status)) errors.push("status is invalid");

  for (const claim of candidate.claims ?? []) {
    if (claim.epistemic === "REAL" && claim.evidence.length === 0) {
      errors.push("REAL claim requires evidence: " + claim.text);
    }
    if (claim.epistemic === "UNKNOWN" && claim.confidence !== undefined && claim.confidence > 0) {
      errors.push("UNKNOWN claim cannot carry positive confidence: " + claim.text);
    }
  }

  for (const action of candidate.nextActions ?? []) {
    if (action.risk === "critical" && !action.requiresHumanGate) {
      errors.push("critical action requires human gate: " + action.id);
    }
    if ((action.risk === "high" || action.risk === "critical") && action.owner === "ai") {
      errors.push("high-risk autonomous action is not permitted: " + action.id);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createProgrammeState(input: Omit<ProgrammeState, "version">): ProgrammeState {
  const state: ProgrammeState = { version: 1, ...input };
  const validation = validateProgrammeState(state);
  if (!validation.valid) throw new Error("Invalid ProgrammeState: " + validation.errors.join("; "));
  return state;
}

export function updateProgrammeState(
  previous: ProgrammeState,
  next: ProgrammeState,
  update: Omit<ProgrammeStateUpdate, "stateId">,
): { state: ProgrammeState; update: ProgrammeStateUpdate } {
  const previousValidation = validateProgrammeState(previous);
  if (!previousValidation.valid) {
    throw new Error("Invalid previous ProgrammeState: " + previousValidation.errors.join("; "));
  }
  const nextValidation = validateProgrammeState(next);
  if (!nextValidation.valid) {
    throw new Error("Invalid next ProgrammeState: " + nextValidation.errors.join("; "));
  }
  if (previous.stateId !== next.stateId) throw new Error("stateId cannot change during an update");
  if (next.updatedAt === previous.updatedAt)
    throw new Error("updatedAt must change when state changes");
  if (update.changed.length === 0) throw new Error("state update must identify what changed");
  if (!nonEmpty(update.reason)) throw new Error("state update requires a reason");
  if (!validEvidence(update.evidence))
    throw new Error("state update requires valid evidence references");

  return { state: next, update: { ...update, stateId: previous.stateId } };
}
