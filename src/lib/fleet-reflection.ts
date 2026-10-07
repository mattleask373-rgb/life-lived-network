export type ReflectionEpistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type ReflectionRisk = "low" | "medium" | "high" | "critical";
export type ReflectionDisposition =
  | "recorded"
  | "investigate"
  | "experiment"
  | "superseded";

export interface ReflectionEvidenceRef {
  id: string;
  source: string;
  locator?: string;
  observedAt?: string;
}

export interface ReflectionAction {
  kind: "investigation" | "experiment" | "review";
  summary: string;
  taskRef?: string;
  bounded: boolean;
  reversible: boolean;
  risk: ReflectionRisk;
  requiresHumanGate: boolean;
}

export interface FleetReflectionFinding {
  id: string;
  cycleId: string;
  observation: string;
  surprise: string;
  assumptionChallenged: string;
  evidence: ReflectionEvidenceRef[];
  epistemic: ReflectionEpistemic;
  uncertainty: string[];
  openQuestions: string[];
  affectedAreas: string[];
  reversible: boolean;
  risk: ReflectionRisk;
  requiresHumanGate: boolean;
  nextAction?: ReflectionAction;
  disposition: ReflectionDisposition;
}

export interface FleetReflectionCycle {
  cycleId: string;
  startedAt: string;
  endedAt: string;
  timeboxHours: number;
  findings: FleetReflectionFinding[];
}

const EPISTEMIC = new Set<ReflectionEpistemic>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);

const RISK = new Set<ReflectionRisk>(["low", "medium", "high", "critical"]);
const DISPOSITION = new Set<ReflectionDisposition>([
  "recorded",
  "investigate",
  "experiment",
  "superseded",
]);

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(nonEmpty);

const evidenceArray = (value: unknown): value is ReflectionEvidenceRef[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      nonEmpty((item as ReflectionEvidenceRef).id) &&
      nonEmpty((item as ReflectionEvidenceRef).source) &&
      ((item as ReflectionEvidenceRef).locator === undefined ||
        nonEmpty((item as ReflectionEvidenceRef).locator)) &&
      ((item as ReflectionEvidenceRef).observedAt === undefined ||
        nonEmpty((item as ReflectionEvidenceRef).observedAt)),
  );

export function reflectionRequiresHumanGate(
  risk: ReflectionRisk,
  reversible: boolean,
): boolean {
  return !reversible || risk === "high" || risk === "critical";
}

export function validateReflectionAction(
  action: ReflectionAction,
): string[] {
  const errors: string[] = [];

  if (!["investigation", "experiment", "review"].includes(action.kind)) {
    errors.push("action kind must be investigation, experiment, or review");
  }
  if (!nonEmpty(action.summary)) errors.push("action summary is required");
  if (action.taskRef !== undefined && !nonEmpty(action.taskRef)) {
    errors.push("taskRef must be non-empty when supplied");
  }
  if (action.bounded !== true) errors.push("reflection actions must be explicitly bounded");
  if (typeof action.reversible !== "boolean") errors.push("action reversibility is required");
  if (!RISK.has(action.risk)) errors.push("action risk is invalid");
  if (
    action.requiresHumanGate !==
    reflectionRequiresHumanGate(action.risk, action.reversible)
  ) {
    errors.push("action human-gate requirement does not match risk/reversibility");
  }

  return errors;
}

export function validateFleetReflectionFinding(
  finding: FleetReflectionFinding,
): string[] {
  const errors: string[] = [];

  if (!nonEmpty(finding.id)) errors.push("finding id is required");
  if (!nonEmpty(finding.cycleId)) errors.push("cycle id is required");
  if (!nonEmpty(finding.observation)) errors.push("observation is required");
  if (!nonEmpty(finding.surprise)) errors.push("surprise is required");
  if (!nonEmpty(finding.assumptionChallenged)) {
    errors.push("assumption challenged is required");
  }
  const validEvidence = evidenceArray(finding.evidence);
  if (!validEvidence) errors.push("evidence must be an array of valid references");
  if (!EPISTEMIC.has(finding.epistemic)) errors.push("epistemic class is invalid");
  if (!stringArray(finding.uncertainty)) errors.push("uncertainty must be an array of strings");
  if (!stringArray(finding.openQuestions)) errors.push("open questions must be an array of strings");
  if (!stringArray(finding.affectedAreas)) errors.push("affected areas must be an array of strings");
  if (typeof finding.reversible !== "boolean") errors.push("reversibility is required");
  if (!RISK.has(finding.risk)) errors.push("risk is invalid");
  if (typeof finding.requiresHumanGate !== "boolean") {
    errors.push("human-gate requirement is required");
  }
  if (!DISPOSITION.has(finding.disposition)) errors.push("disposition is invalid");

  const evidenceCount = validEvidence ? finding.evidence.length : 0;
  if (finding.epistemic === "REAL" && evidenceCount === 0) {
    errors.push("REAL reflections require evidence");
  }
  if (finding.epistemic === "UNKNOWN" && evidenceCount === 0) {
    if (stringArray(finding.uncertainty) && finding.uncertainty.length === 0) {
      errors.push("UNKNOWN reflections must preserve explicit uncertainty");
    }
  }

  const requiredGate = reflectionRequiresHumanGate(finding.risk, finding.reversible);
  if (finding.requiresHumanGate !== requiredGate) {
    errors.push("human-gate requirement does not match risk/reversibility");
  }

  if (
    finding.nextAction &&
    validateReflectionAction(finding.nextAction).length > 0
  ) {
    errors.push(...validateReflectionAction(finding.nextAction));
  }

  if (
    finding.nextAction &&
    (finding.epistemic === "UNKNOWN" ||
      finding.epistemic === "SPECULATIVE" ||
      finding.epistemic === "IMAGINED") &&
    finding.nextAction.kind !== "investigation" &&
    finding.nextAction.kind !== "experiment"
  ) {
    errors.push("uncertain/speculative findings cannot become direct review authority");
  }

  return [...new Set(errors)];
}

export function validateFleetReflectionCycle(
  cycle: FleetReflectionCycle,
): string[] {
  const errors: string[] = [];

  if (!nonEmpty(cycle.cycleId)) errors.push("cycle id is required");
  if (!nonEmpty(cycle.startedAt) || !nonEmpty(cycle.endedAt)) {
    errors.push("cycle timestamps are required");
  }
  if (!Number.isFinite(cycle.timeboxHours) || cycle.timeboxHours <= 0) {
    errors.push("timeboxHours must be a positive finite number");
  }
  if (!Array.isArray(cycle.findings)) errors.push("findings must be an array");

  const findings = Array.isArray(cycle.findings) ? cycle.findings : [];
  const ids = new Set<string>();
  for (const finding of findings) {
    if (ids.has(finding.id)) errors.push(`duplicate finding id: ${finding.id}`);
    ids.add(finding.id);
    errors.push(...validateFleetReflectionFinding(finding));
    if (finding.cycleId !== cycle.cycleId) {
      errors.push(`finding ${finding.id} belongs to another cycle`);
    }
  }

  return [...new Set(errors)];
}

export function createFleetReflectionFinding(
  input: Omit<FleetReflectionFinding, "requiresHumanGate"> & {
    requiresHumanGate?: boolean;
  },
): FleetReflectionFinding {
  const requiresHumanGate =
    input.requiresHumanGate ??
    reflectionRequiresHumanGate(input.risk, input.reversible);

  return { ...input, requiresHumanGate };
}

/**
 * Returns only bounded next steps. This function never executes or mutates
 * another system; it is a reflection-to-intent boundary.
 */
export function nextBoundedReflectionActions(
  cycle: FleetReflectionCycle,
): ReflectionAction[] {
  const errors = validateFleetReflectionCycle(cycle);
  if (errors.length > 0) return [];

  return cycle.findings
    .filter((finding) => finding.disposition !== "superseded" && finding.nextAction)
    .map((finding) => finding.nextAction!)
    .filter((action) => action.bounded === true);
}
