/**
 * Opportunity Frontier — AI-NATIVE-06 / Issue #81
 *
 * Pure, provider-neutral observation contract.
 * It does not discover supply, rank opportunities, invent world facts,
 * execute experiments, or mutate production.
 */

export type FrontierEpistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type FrontierRisk = "low" | "medium" | "high" | "critical";

export interface FrontierEvidenceRef {
  id: string;
  source: string;
  locator?: string;
  observedAt?: string;
  freshness?: "fresh" | "stale" | "unknown";
}

export interface OpportunityFrontierObservation {
  id: string;
  scope: string;
  objective: string;
  observedSupplyState: string;
  sourceCoverage: string;
  unknowns: string[];
  unmetNeed: string;
  interpretation: FrontierEpistemic;
  candidateOpportunity: string;
  evidence: FrontierEvidenceRef[];
  reversible: boolean;
  risk: FrontierRisk;
  requiresHumanGate: boolean;
  nextTaskId?: string;
}

export interface FrontierValidation {
  valid: boolean;
  errors: string[];
}

const EPISTEMIC = new Set<FrontierEpistemic>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);

const RISKS = new Set<FrontierRisk>(["low", "medium", "high", "critical"]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validEvidence(value: unknown): value is FrontierEvidenceRef[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        nonEmpty((item as FrontierEvidenceRef).id) &&
        nonEmpty((item as FrontierEvidenceRef).source),
    )
  );
}

export function frontierRequiresHumanGate(
  observation: Pick<OpportunityFrontierObservation, "risk" | "reversible">,
): boolean {
  return !observation.reversible || observation.risk === "high" || observation.risk === "critical";
}

export function validateOpportunityFrontier(
  observation: OpportunityFrontierObservation,
): FrontierValidation {
  const errors: string[] = [];

  if (!nonEmpty(observation.id)) errors.push("observation id is required");
  if (!nonEmpty(observation.scope)) errors.push("scope is required");
  if (!nonEmpty(observation.objective)) errors.push("objective is required");
  if (!nonEmpty(observation.observedSupplyState)) errors.push("observed supply state is required");
  if (!nonEmpty(observation.sourceCoverage)) errors.push("source coverage is required");
  if (!nonEmpty(observation.unmetNeed)) errors.push("unmet need is required");
  if (!nonEmpty(observation.candidateOpportunity)) errors.push("candidate opportunity is required");
  if (!Array.isArray(observation.unknowns)) errors.push("unknowns must be an array");
  if (!validEvidence(observation.evidence))
    errors.push("evidence must be an array of valid references");
  if (!EPISTEMIC.has(observation.interpretation)) errors.push("invalid epistemic class");
  if (!RISKS.has(observation.risk)) errors.push("invalid risk class");
  if (typeof observation.reversible !== "boolean") errors.push("reversibility must be explicit");
  if (typeof observation.requiresHumanGate !== "boolean")
    errors.push("human-gate requirement must be explicit");

  if (observation.interpretation === "REAL" && observation.evidence.length === 0) {
    errors.push("REAL observations require evidence");
  }

  if (frontierRequiresHumanGate(observation) && !observation.requiresHumanGate) {
    errors.push("irreversible or high/critical-risk observations require a human gate");
  }

  if (
    observation.interpretation === "UNKNOWN" &&
    observation.nextTaskId &&
    observation.nextTaskId.trim().length === 0
  ) {
    errors.push("next task id cannot be empty");
  }

  return { valid: errors.length === 0, errors };
}

export function createFrontierObservation(
  input: Omit<OpportunityFrontierObservation, "requiresHumanGate"> & {
    requiresHumanGate?: boolean;
  },
): OpportunityFrontierObservation {
  return {
    ...input,
    requiresHumanGate: input.requiresHumanGate ?? frontierRequiresHumanGate(input),
  };
}

export function canBecomeBoundedTask(
  observation: OpportunityFrontierObservation,
): FrontierValidation {
  const errors: string[] = [];

  if (!validateOpportunityFrontier(observation).valid) {
    errors.push(...validateOpportunityFrontier(observation).errors);
  }

  if (observation.interpretation === "UNKNOWN") {
    errors.push("UNKNOWN observations require an experiment or evidence-gathering task");
  }

  if (observation.interpretation === "IMAGINED" || observation.interpretation === "SPECULATIVE") {
    errors.push("speculative frontier observations require testing before ordinary execution");
  }

  if (observation.evidence.length === 0) {
    errors.push("bounded task conversion requires evidence references");
  }

  return { valid: errors.length === 0, errors };
}
