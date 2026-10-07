export type RealityDeltaEpistemic = "REAL" | "PLAUSIBLE" | "EXPERIMENTAL" | "SPECULATIVE" | "IMAGINED" | "UNKNOWN";
export type RealityDeltaRisk = "low" | "medium" | "high" | "critical";
export type RealityDeltaActionKind = "investigation" | "experiment" | "review";

export interface RealityEvidence {
  id: string;
  source: string;
  claim: string;
  observedAt?: string;
  freshness?: string;
}

export interface RealitySnapshot {
  id: string;
  scope: string;
  objective: string;
  observedState: string;
  evidence: RealityEvidence[];
  unknowns: string[];
  epistemic: RealityDeltaEpistemic;
  capturedAt: string;
}

export interface RealityDeltaAction {
  kind: RealityDeltaActionKind;
  summary: string;
  bounded: boolean;
  reversible: boolean;
  risk: RealityDeltaRisk;
  requiresHumanGate: boolean;
}

export interface RealityDelta {
  id: string;
  scope: string;
  objective: string;
  previousSnapshotId: string;
  currentSnapshotId: string;
  changed: boolean;
  previousState: string;
  currentState: string;
  addedEvidence: RealityEvidence[];
  removedEvidence: RealityEvidence[];
  persistentEvidence: RealityEvidence[];
  newUnknowns: string[];
  resolvedUnknowns: string[];
  persistentUnknowns: string[];
  epistemic: RealityDeltaEpistemic;
  uncertainty: string[];
  action?: RealityDeltaAction;
}

const EPISTEMIC = new Set<RealityDeltaEpistemic>(["REAL","PLAUSIBLE","EXPERIMENTAL","SPECULATIVE","IMAGINED","UNKNOWN"]);
const RISK = new Set<RealityDeltaRisk>(["low","medium","high","critical"]);
const ACTIONS = new Set<RealityDeltaActionKind>(["investigation","experiment","review"]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validEvidence(value: unknown): value is RealityEvidence {
  if (!value || typeof value !== "object") return false;
  const evidence = value as RealityEvidence;
  return nonEmpty(evidence.id) && nonEmpty(evidence.source) && nonEmpty(evidence.claim) &&
    (evidence.observedAt === undefined || nonEmpty(evidence.observedAt)) &&
    (evidence.freshness === undefined || nonEmpty(evidence.freshness));
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

export function realityDeltaRequiresHumanGate(risk: RealityDeltaRisk, reversible: boolean): boolean {
  return !reversible || risk === "high" || risk === "critical";
}

export function validateRealitySnapshot(snapshot: RealitySnapshot): boolean {
  if (!snapshot || typeof snapshot !== "object" ||
    !nonEmpty(snapshot.id) || !nonEmpty(snapshot.scope) || !nonEmpty(snapshot.objective) ||
    !nonEmpty(snapshot.observedState) || !nonEmpty(snapshot.capturedAt) ||
    !Array.isArray(snapshot.evidence) || !Array.isArray(snapshot.unknowns) ||
    !EPISTEMIC.has(snapshot.epistemic)) return false;
  if (!snapshot.evidence.every(validEvidence) || !unique(snapshot.evidence.map((item) => item.id))) return false;
  if (!snapshot.unknowns.every(nonEmpty) || !unique(snapshot.unknowns)) return false;
  if (snapshot.epistemic === "REAL" && snapshot.evidence.length === 0) return false;
  return true;
}

export function validateRealityDeltaAction(action: RealityDeltaAction): boolean {
  if (!action || typeof action !== "object" || !ACTIONS.has(action.kind) || !nonEmpty(action.summary) ||
    typeof action.bounded !== "boolean" || typeof action.reversible !== "boolean" ||
    !RISK.has(action.risk) || typeof action.requiresHumanGate !== "boolean") return false;
  if (!action.bounded) return false;
  if (realityDeltaRequiresHumanGate(action.risk, action.reversible) && !action.requiresHumanGate) return false;
  return true;
}

export function validateRealityDelta(delta: RealityDelta): boolean {
  if (!delta || typeof delta !== "object" || !nonEmpty(delta.id) || !nonEmpty(delta.scope) ||
    !nonEmpty(delta.objective) || !nonEmpty(delta.previousSnapshotId) || !nonEmpty(delta.currentSnapshotId) ||
    !nonEmpty(delta.previousState) || !nonEmpty(delta.currentState) || typeof delta.changed !== "boolean" ||
    !Array.isArray(delta.addedEvidence) || !Array.isArray(delta.removedEvidence) ||
    !Array.isArray(delta.persistentEvidence) || !Array.isArray(delta.newUnknowns) ||
    !Array.isArray(delta.resolvedUnknowns) || !Array.isArray(delta.persistentUnknowns) ||
    !Array.isArray(delta.uncertainty) || !EPISTEMIC.has(delta.epistemic)) return false;
  if (delta.previousSnapshotId === delta.currentSnapshotId) return false;
  const allEvidence = [...delta.addedEvidence, ...delta.removedEvidence, ...delta.persistentEvidence];
  if (!allEvidence.every(validEvidence) || !unique(allEvidence.map((item) => item.id))) return false;
  if (!delta.newUnknowns.every(nonEmpty) || !delta.resolvedUnknowns.every(nonEmpty) ||
    !delta.persistentUnknowns.every(nonEmpty) || !delta.uncertainty.every(nonEmpty)) return false;
  if (delta.epistemic === "REAL" && delta.addedEvidence.length + delta.persistentEvidence.length === 0) return false;
  return delta.action ? validateRealityDeltaAction(delta.action) : true;
}

export function compareRealitySnapshots(previous: RealitySnapshot, current: RealitySnapshot, action?: RealityDeltaAction): RealityDelta {
  if (!validateRealitySnapshot(previous) || !validateRealitySnapshot(current)) throw new Error("Invalid reality snapshot");
  if (previous.scope !== current.scope || previous.objective !== current.objective) throw new Error("Reality snapshots must share scope and objective");
  if (previous.id === current.id) throw new Error("Reality snapshots must have different ids");
  if (action && !validateRealityDeltaAction(action)) throw new Error("Invalid reality delta action");

  const previousById = new Map(previous.evidence.map((item) => [item.id, item]));
  const currentById = new Map(current.evidence.map((item) => [item.id, item]));
  const addedEvidence = current.evidence.filter((item) => !previousById.has(item.id));
  const removedEvidence = previous.evidence.filter((item) => !currentById.has(item.id));
  const persistentEvidence = current.evidence.filter((item) => previousById.has(item.id));

  const previousUnknowns = new Set(previous.unknowns);
  const currentUnknowns = new Set(current.unknowns);
  const newUnknowns = current.unknowns.filter((item) => !previousUnknowns.has(item));
  const resolvedUnknowns = previous.unknowns.filter((item) => !currentUnknowns.has(item));
  const persistentUnknowns = current.unknowns.filter((item) => previousUnknowns.has(item));

  const changed = previous.observedState !== current.observedState || addedEvidence.length > 0 ||
    removedEvidence.length > 0 || newUnknowns.length > 0 || resolvedUnknowns.length > 0;

  return {
    id: `reality-delta:${previous.id}->${current.id}`,
    scope: current.scope,
    objective: current.objective,
    previousSnapshotId: previous.id,
    currentSnapshotId: current.id,
    changed,
    previousState: previous.observedState,
    currentState: current.observedState,
    addedEvidence,
    removedEvidence,
    persistentEvidence,
    newUnknowns,
    resolvedUnknowns,
    persistentUnknowns,
    epistemic: current.epistemic,
    uncertainty: [...new Set([...current.unknowns, ...newUnknowns])],
    action,
  };
}

export function canBecomeBoundedRealityAction(delta: RealityDelta): boolean {
  if (!validateRealityDelta(delta) || !delta.action) return false;
  if (delta.epistemic === "UNKNOWN" || delta.epistemic === "SPECULATIVE" || delta.epistemic === "IMAGINED") return false;
  return delta.action.bounded;
}
