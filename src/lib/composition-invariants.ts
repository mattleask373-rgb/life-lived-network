/**
 * Cross-kernel composition invariants.
 *
 * Proves that epistemic certainty cannot silently increase across handoffs
 * between conceptual AI-native stages, without importing branch-only modules.
 *
 * REALITY: these stages exist as parallel PR contracts, not yet on main.
 * This module encodes the *invariants* the fleet must preserve when they compose.
 */

export type Epistemic =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type Risk = "low" | "medium" | "high" | "critical";

/** Ordered weakness: higher index = stronger claim about the world. */
const STRENGTH: Record<Epistemic, number> = {
  UNKNOWN: 0,
  IMAGINED: 1,
  SPECULATIVE: 2,
  EXPERIMENTAL: 3,
  PLAUSIBLE: 4,
  REAL: 5,
};

export interface StagePayload {
  stage: string;
  epistemic: Epistemic;
  evidenceIds: string[];
  risk: Risk;
  reversible: boolean;
  requiresHumanGate: boolean;
  uncertainty: string[];
}

export interface HandoffResult {
  allowed: boolean;
  errors: string[];
}

export function epistemicStrength(e: Epistemic): number {
  return STRENGTH[e];
}

/** Downstream must not silently strengthen epistemic class without new evidence. */
export function handoffPreservesEpistemic(
  upstream: StagePayload,
  downstream: StagePayload,
  newEvidenceIds: string[] = [],
): HandoffResult {
  const errors: string[] = [];
  const up = epistemicStrength(upstream.epistemic);
  const down = epistemicStrength(downstream.epistemic);

  if (down > up && newEvidenceIds.length === 0) {
    errors.push(
      `epistemic strengthened ${upstream.epistemic}→${downstream.epistemic} without new evidence`,
    );
  }

  if (upstream.epistemic === "UNKNOWN" && downstream.epistemic === "REAL") {
    errors.push("UNKNOWN cannot become REAL in a single handoff");
  }

  if (upstream.epistemic === "IMAGINED" && downstream.epistemic === "REAL") {
    errors.push("IMAGINED cannot become REAL in a single handoff");
  }

  if (
    upstream.uncertainty.length > 0 &&
    downstream.uncertainty.length === 0 &&
    newEvidenceIds.length === 0
  ) {
    errors.push("uncertainty cleared without new evidence");
  }

  const allowed = new Set([...upstream.evidenceIds, ...newEvidenceIds]);
  for (const id of downstream.evidenceIds) {
    if (!allowed.has(id)) {
      errors.push(`downstream invented evidence id ${id}`);
    }
  }

  const gateNeeded =
    !downstream.reversible || downstream.risk === "high" || downstream.risk === "critical";
  if (gateNeeded && !downstream.requiresHumanGate) {
    errors.push("high-risk or irreversible handoff dropped human gate");
  }

  return { allowed: errors.length === 0, errors };
}

/** Falsified / removed evidence cannot sustain REAL. */
export function realRequiresLiveEvidence(
  epistemic: Epistemic,
  evidenceIds: string[],
  removedIds: string[],
): HandoffResult {
  const errors: string[] = [];
  const live = evidenceIds.filter((id) => !removedIds.includes(id));
  if (epistemic === "REAL" && live.length === 0) {
    errors.push("REAL cannot stand after all supporting evidence removed");
  }
  return { allowed: errors.length === 0, errors };
}

/** Stale evidence cannot alone justify elevating certainty. */
export function staleCannotElevate(
  upstream: StagePayload,
  downstream: StagePayload,
  evidenceFreshness: Record<string, "fresh" | "stale" | "unknown">,
): HandoffResult {
  const errors: string[] = [];
  const up = epistemicStrength(upstream.epistemic);
  const down = epistemicStrength(downstream.epistemic);
  if (down <= up) return { allowed: true, errors: [] };

  const elevatingIds = downstream.evidenceIds.filter((id) => !upstream.evidenceIds.includes(id));
  if (elevatingIds.length === 0) {
    errors.push("certainty elevated without new evidence ids");
    return { allowed: false, errors };
  }
  for (const id of elevatingIds) {
    const f = evidenceFreshness[id] ?? "unknown";
    if (f === "stale" || f === "unknown") {
      errors.push(`cannot elevate certainty using ${f} evidence ${id}`);
    }
  }
  return { allowed: errors.length === 0, errors };
}
