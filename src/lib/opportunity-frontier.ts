/**
 * Opportunity Frontier — AI-NATIVE-06 / Issue #81
 *
 * Observes canonical findSupply() answers and ingestion provenance signals
 * to surface where the model may under-represent reality.
 *
 * DOES NOT: re-rank, re-match, invent demand/inventory, or replace findSupply().
 * A frontier observation is not a fact about the world — it is a bounded signal.
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
}

/** Minimal shape of a SupplyAnswer for observation (avoids tight coupling). */
export interface SupplyObservation {
  resultsCount: number;
  bandsSearched: string[];
  diagnostics: {
    excludedByStatus?: number;
    excludedByPlace?: number;
    excludedByFreshness?: number;
    excludedByQualification?: number;
    excludedByCapability?: number;
    excludedByTime?: number;
  };
  unknowns?: string[];
}

export interface IngestObservation {
  sourceId: string;
  freshness: "fresh" | "stale" | "unknown";
  recordsSeen: number;
  provenancePresent: boolean;
}

export interface FrontierObservation {
  id: string;
  scope: string;
  supplyState: "empty" | "sparse" | "present" | "unknown";
  observedPattern: string;
  unknowns: string[];
  structuralGap?: string;
  epistemic: FrontierEpistemic;
  evidence: FrontierEvidenceRef[];
  candidateExperiment?: string;
  reversible: boolean;
  risk: FrontierRisk;
  requiresHumanGate: boolean;
  nextTaskSketch?: string;
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

export function classifySupplyState(
  observation: SupplyObservation,
): FrontierObservation["supplyState"] {
  if (observation.resultsCount <= 0) return "empty";
  if (observation.resultsCount <= 2) return "sparse";
  return "present";
}

/**
 * Derive a frontier observation from supply diagnostics + optional ingest signals.
 * Empty supply is not evidence that the place has nothing — it is a model gap signal.
 */
export function observeFrontier(input: {
  id: string;
  scope: string;
  supply: SupplyObservation;
  ingest?: IngestObservation[];
  evidence?: FrontierEvidenceRef[];
}): FrontierObservation {
  const supplyState = classifySupplyState(input.supply);
  const unknowns: string[] = [...(input.supply.unknowns ?? [])];
  const d = input.supply.diagnostics;
  const exclusions =
    (d.excludedByStatus ?? 0) +
    (d.excludedByPlace ?? 0) +
    (d.excludedByFreshness ?? 0) +
    (d.excludedByQualification ?? 0) +
    (d.excludedByCapability ?? 0) +
    (d.excludedByTime ?? 0);

  if (exclusions > 0) {
    unknowns.push(`${exclusions} candidate(s) excluded by filters`);
  }

  let structuralGap: string | undefined;
  let observedPattern: string;
  let epistemic: FrontierEpistemic = "EXPERIMENTAL";
  let candidateExperiment: string | undefined;

  if (supplyState === "empty") {
    observedPattern = "Canonical discovery returned no results for this scope";
    structuralGap = "Absence of records is not proof of absence in the real world";
    candidateExperiment =
      "Verify whether external-world sources cover this locality; if not, mark coverage UNKNOWN";
    epistemic = input.ingest && input.ingest.length > 0 ? "PLAUSIBLE" : "UNKNOWN";
  } else if (supplyState === "sparse") {
    observedPattern = "Canonical discovery returned only sparse results";
    structuralGap = "Sparse model may under-represent real activity";
    candidateExperiment = "Compare recorded supply against one additional attributable source";
    epistemic = "EXPERIMENTAL";
  } else {
    observedPattern = "Canonical discovery returned present supply";
    epistemic = "PLAUSIBLE";
  }

  if (input.ingest) {
    for (const src of input.ingest) {
      if (src.freshness === "stale") unknowns.push(`source ${src.sourceId} is stale`);
      if (src.freshness === "unknown") unknowns.push(`source ${src.sourceId} freshness unknown`);
      if (!src.provenancePresent) unknowns.push(`source ${src.sourceId} lacks provenance`);
    }
  }

  return {
    id: input.id,
    scope: input.scope,
    supplyState,
    observedPattern,
    unknowns,
    structuralGap,
    epistemic,
    evidence: input.evidence ?? [],
    candidateExperiment,
    reversible: true,
    risk: "low",
    requiresHumanGate: false,
    nextTaskSketch: candidateExperiment,
  };
}

export function validateFrontierObservation(obs: FrontierObservation): FrontierValidation {
  const errors: string[] = [];
  if (!nonEmpty(obs.id)) errors.push("id is required");
  if (!nonEmpty(obs.scope)) errors.push("scope is required");
  if (!nonEmpty(obs.observedPattern)) errors.push("observed pattern is required");
  if (!EPISTEMIC.has(obs.epistemic)) errors.push("invalid epistemic class");
  if (!RISKS.has(obs.risk)) errors.push("invalid risk class");
  if (!validEvidence(obs.evidence)) errors.push("evidence must be valid references");
  if (obs.epistemic === "REAL" && obs.supplyState === "empty") {
    errors.push("empty supply cannot be classified REAL as a world claim");
  }
  if (typeof obs.reversible !== "boolean") errors.push("reversibility must be explicit");
  if (typeof obs.requiresHumanGate !== "boolean") errors.push("human-gate must be explicit");
  if (
    (obs.risk === "high" || obs.risk === "critical" || !obs.reversible) &&
    !obs.requiresHumanGate
  ) {
    errors.push("high-risk or irreversible frontier work requires a human gate");
  }
  return { valid: errors.length === 0, errors };
}
