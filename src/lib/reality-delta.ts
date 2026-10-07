export type RealityDeltaEpistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

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
  addedEvidence: RealityEvidence[];
  removedEvidence: RealityEvidence[];
  persistentEvidence: RealityEvidence[];
  newUnknowns: string[];
  resolvedUnknowns: string[];
  persistentUnknowns: string[];
  uncertainty: string[];
  epistemic: RealityDeltaEpistemic;
  reversible: boolean;
  risk: RealityDeltaRisk;
  requiresHumanGate: boolean;
  nextAction?: RealityDeltaAction;
}

const EPISTEMIC = new Set<RealityDeltaEpistemic>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);

const RISKS = new Set<RealityDeltaRisk>(["low", "medium", "high", "critical"]);
const ACTIONS = new Set<RealityDeltaActionKind>([
  "investigation",
  "experiment",
  "review",
]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function evidenceKey(item: RealityEvidence): string {
  return `${item.source}::${item.id}`;
}

function validEvidenceList(value: unknown): value is RealityEvidence[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        nonEmpty((item as RealityEvidence).id) &&
        nonEmpty((item as RealityEvidence).source) &&
        nonEmpty((item as RealityEvidence).claim),
    )
  );
}

export function realityDeltaRequiresHumanGate(
  risk: RealityDeltaRisk,
  reversible: boolean,
): boolean {
  return !reversible || risk === "high" || risk === "critical";
}

export function validateRealitySnapshot(snapshot: RealitySnapshot): boolean {
  if (!nonEmpty(snapshot.id)) return false;
  if (!nonEmpty(snapshot.scope)) return false;
  if (!nonEmpty(snapshot.objective)) return false;
  if (!nonEmpty(snapshot.observedState)) return false;
  if (!nonEmpty(snapshot.capturedAt)) return false;
  if (!EPISTEMIC.has(snapshot.epistemic)) return false;
  if (!validEvidenceList(snapshot.evidence)) return false;
  if (!Array.isArray(snapshot.unknowns)) return false;
  if (snapshot.epistemic === "REAL" && snapshot.evidence.length === 0) return false;
  const ids = snapshot.evidence.map((e) => e.id);
  if (new Set(ids).size !== ids.length) return false;
  return true;
}

export function validateRealityDeltaAction(action: RealityDeltaAction): boolean {
  if (!ACTIONS.has(action.kind)) return false;
  if (!nonEmpty(action.summary)) return false;
  if (action.bounded !== true) return false;
  if (typeof action.reversible !== "boolean") return false;
  if (!RISKS.has(action.risk)) return false;
  if (typeof action.requiresHumanGate !== "boolean") return false;
  if (realityDeltaRequiresHumanGate(action.risk, action.reversible) !== action.requiresHumanGate) {
    return false;
  }
  return true;
}

export function validateRealityDelta(delta: RealityDelta): boolean {
  if (!nonEmpty(delta.id)) return false;
  if (!nonEmpty(delta.scope)) return false;
  if (!nonEmpty(delta.objective)) return false;
  if (!validEvidenceList(delta.addedEvidence)) return false;
  if (!validEvidenceList(delta.removedEvidence)) return false;
  if (!validEvidenceList(delta.persistentEvidence)) return false;
  if (!EPISTEMIC.has(delta.epistemic)) return false;
  if (!RISKS.has(delta.risk)) return false;
  if (typeof delta.reversible !== "boolean") return false;
  if (typeof delta.requiresHumanGate !== "boolean") return false;
  if (realityDeltaRequiresHumanGate(delta.risk, delta.reversible) !== delta.requiresHumanGate) {
    return false;
  }
  if (delta.nextAction && !validateRealityDeltaAction(delta.nextAction)) return false;
  return true;
}

export function compareRealitySnapshots(
  previous: RealitySnapshot,
  current: RealitySnapshot,
  nextAction?: RealityDeltaAction,
): RealityDelta {
  const prevMap = new Map(previous.evidence.map((e) => [evidenceKey(e), e]));
  const currMap = new Map(current.evidence.map((e) => [evidenceKey(e), e]));

  const addedEvidence: RealityEvidence[] = [];
  const removedEvidence: RealityEvidence[] = [];
  const persistentEvidence: RealityEvidence[] = [];

  for (const [k, e] of currMap) {
    if (prevMap.has(k)) persistentEvidence.push(e);
    else addedEvidence.push(e);
  }
  for (const [k, e] of prevMap) {
    if (!currMap.has(k)) removedEvidence.push(e);
  }

  const prevUnknowns = new Set(previous.unknowns);
  const currUnknowns = new Set(current.unknowns);
  const newUnknowns = current.unknowns.filter((u) => !prevUnknowns.has(u));
  const resolvedUnknowns = previous.unknowns.filter((u) => !currUnknowns.has(u));
  const persistentUnknowns = current.unknowns.filter((u) => prevUnknowns.has(u));

  const changed =
    addedEvidence.length > 0 ||
    removedEvidence.length > 0 ||
    newUnknowns.length > 0 ||
    resolvedUnknowns.length > 0;

  const epistemic: RealityDeltaEpistemic =
    current.epistemic === "UNKNOWN"
      ? "UNKNOWN"
      : changed
        ? current.epistemic
        : "UNKNOWN";

  const risk: RealityDeltaRisk = "low";
  const reversible = true;
  const requiresHumanGate = realityDeltaRequiresHumanGate(risk, reversible);

  const uncertainty = [
    ...newUnknowns,
    ...persistentUnknowns,
    ...(removedEvidence.length > 0
      ? ["Removed records are not proof the real-world thing disappeared"]
      : []),
  ];

  return {
    id: `delta:${previous.id}->${current.id}`,
    scope: current.scope,
    objective: current.objective,
    previousSnapshotId: previous.id,
    currentSnapshotId: current.id,
    changed,
    addedEvidence,
    removedEvidence,
    persistentEvidence,
    newUnknowns,
    resolvedUnknowns,
    persistentUnknowns,
    uncertainty,
    epistemic,
    reversible,
    risk,
    requiresHumanGate,
    nextAction,
  };
}

export function canBecomeBoundedRealityAction(delta: RealityDelta): boolean {
  if (!validateRealityDelta(delta)) return false;
  if (delta.epistemic === "UNKNOWN" || delta.epistemic === "IMAGINED") return false;
  if (!delta.nextAction) return false;
  return validateRealityDeltaAction(delta.nextAction);
}
