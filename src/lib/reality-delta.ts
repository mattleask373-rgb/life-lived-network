/**
 * Reality Delta — AI-NATIVE-08
 *
 * Compares two caller-supplied evidence snapshots and records what changed,
 * what remains unknown, and what bounded investigation could follow.
 *
 * Does not replace findSupply(), invent world facts, or grant execution authority.
 */

export type DeltaEpistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type DeltaRisk = "low" | "medium" | "high" | "critical";

export type DeltaActionKind = "investigation" | "experiment" | "review";

export interface DeltaEvidenceRef {
  id: string;
  source: string;
  locator?: string;
}

export interface RealitySnapshot {
  id: string;
  observedAt: string;
  evidence: DeltaEvidenceRef[];
  unknowns?: string[];
}

export interface DeltaAction {
  kind: DeltaActionKind;
  summary: string;
  bounded: boolean;
  reversible: boolean;
  risk: DeltaRisk;
  requiresHumanGate: boolean;
}

export interface RealityDelta {
  id: string;
  beforeId: string;
  afterId: string;
  added: DeltaEvidenceRef[];
  removed: DeltaEvidenceRef[];
  persistent: DeltaEvidenceRef[];
  unknowns: string[];
  epistemic: DeltaEpistemic;
  risk: DeltaRisk;
  reversible: boolean;
  requiresHumanGate: boolean;
  nextAction?: DeltaAction;
}

export interface DeltaValidation {
  valid: boolean;
  errors: string[];
}

const EPISTEMIC = new Set<DeltaEpistemic>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);

const RISKS = new Set<DeltaRisk>(["low", "medium", "high", "critical"]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function keyOf(ref: DeltaEvidenceRef): string {
  return `${ref.source}::${ref.id}::${ref.locator ?? ""}`;
}

function validEvidence(value: unknown): value is DeltaEvidenceRef[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        nonEmpty((item as DeltaEvidenceRef).id) &&
        nonEmpty((item as DeltaEvidenceRef).source),
    )
  );
}

export function deltaRequiresHumanGate(risk: DeltaRisk, reversible: boolean): boolean {
  return !reversible || risk === "high" || risk === "critical";
}

export function computeRealityDelta(input: {
  id: string;
  before: RealitySnapshot;
  after: RealitySnapshot;
  epistemic?: DeltaEpistemic;
  risk?: DeltaRisk;
  reversible?: boolean;
}): RealityDelta {
  const beforeMap = new Map(
    (validEvidence(input.before.evidence) ? input.before.evidence : []).map((e) => [keyOf(e), e]),
  );
  const afterMap = new Map(
    (validEvidence(input.after.evidence) ? input.after.evidence : []).map((e) => [keyOf(e), e]),
  );

  const added: DeltaEvidenceRef[] = [];
  const removed: DeltaEvidenceRef[] = [];
  const persistent: DeltaEvidenceRef[] = [];

  for (const [k, e] of afterMap) {
    if (beforeMap.has(k)) persistent.push(e);
    else added.push(e);
  }
  for (const [k, e] of beforeMap) {
    if (!afterMap.has(k)) removed.push(e);
  }

  const unknowns = [
    ...(input.before.unknowns ?? []),
    ...(input.after.unknowns ?? []),
  ];

  const risk = input.risk ?? "low";
  const reversible = input.reversible ?? true;
  const requiresHumanGate = deltaRequiresHumanGate(risk, reversible);

  return {
    id: input.id,
    beforeId: input.before.id,
    afterId: input.after.id,
    added,
    removed,
    persistent,
    unknowns,
    epistemic: input.epistemic ?? (added.length || removed.length ? "PLAUSIBLE" : "UNKNOWN"),
    risk,
    reversible,
    requiresHumanGate,
  };
}

export function validateRealityDelta(delta: RealityDelta): DeltaValidation {
  const errors: string[] = [];
  if (!nonEmpty(delta.id)) errors.push("id is required");
  if (!nonEmpty(delta.beforeId)) errors.push("beforeId is required");
  if (!nonEmpty(delta.afterId)) errors.push("afterId is required");
  if (!validEvidence(delta.added)) errors.push("added evidence invalid");
  if (!validEvidence(delta.removed)) errors.push("removed evidence invalid");
  if (!validEvidence(delta.persistent)) errors.push("persistent evidence invalid");
  if (!EPISTEMIC.has(delta.epistemic)) errors.push("invalid epistemic class");
  if (!RISKS.has(delta.risk)) errors.push("invalid risk");
  if (typeof delta.reversible !== "boolean") errors.push("reversibility required");
  if (typeof delta.requiresHumanGate !== "boolean") errors.push("human-gate required");
  if (delta.epistemic === "REAL" && delta.added.length === 0 && delta.removed.length === 0) {
    errors.push("REAL delta requires observed change evidence");
  }
  if (deltaRequiresHumanGate(delta.risk, delta.reversible) && !delta.requiresHumanGate) {
    errors.push("high-risk or irreversible delta requires human gate");
  }
  if (delta.nextAction) {
    if (delta.nextAction.bounded !== true) errors.push("next action must be bounded");
    if (
      deltaRequiresHumanGate(delta.nextAction.risk, delta.nextAction.reversible) &&
      !delta.nextAction.requiresHumanGate
    ) {
      errors.push("next action human-gate does not match risk/reversibility");
    }
  }
  return { valid: errors.length === 0, errors };
}
