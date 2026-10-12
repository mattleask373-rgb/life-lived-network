/**
 * Local Page Quality & SEO Indexability Engine.
 *
 * Implements the evidence-gated indexability decision state machine:
 * INDEXABLE | NEEDS_EVIDENCE | NOINDEX | DRAFT | STALE | DEINDEX_REQUIRED
 *
 * Defends against doorway pages, thin keyword permutations, and empty surfaces.
 */

export type LocalPageIndexability =
  "INDEXABLE" | "NEEDS_EVIDENCE" | "NOINDEX" | "DRAFT" | "STALE" | "DEINDEX_REQUIRED";

export interface LocalPageEvidence {
  isCanonicalRoute: boolean;
  hasResolvedLocality: boolean;
  realPossibilityCount: number;
  realEventCount: number;
  realNeedCount: number;
  realCapabilityCount: number;
  hasFreshData: boolean;
  hasMeaningfulUserAction: boolean;
}

export interface LocalPageQualityResult {
  state: LocalPageIndexability;
  isIndexable: boolean;
  reasons: string[];
}

export function evaluateLocalPageQuality(evidence: LocalPageEvidence): LocalPageQualityResult {
  const reasons: string[] = [];

  if (!evidence.isCanonicalRoute) {
    reasons.push("Route is not canonical; tracking parameters or fragment present.");
    return { state: "NOINDEX", isIndexable: false, reasons };
  }

  if (!evidence.hasResolvedLocality) {
    reasons.push("Locality is missing or unverified.");
    return { state: "NOINDEX", isIndexable: false, reasons };
  }

  const totalInventory =
    evidence.realPossibilityCount +
    evidence.realEventCount +
    evidence.realNeedCount +
    evidence.realCapabilityCount;

  if (totalInventory === 0) {
    reasons.push("Zero trustworthy evidence or local inventory found.");
    return { state: "NOINDEX", isIndexable: false, reasons };
  }

  if (!evidence.hasFreshData) {
    reasons.push("Inventory evidence is stale or beyond freshness window.");
    return { state: "STALE", isIndexable: false, reasons };
  }

  if (!evidence.hasMeaningfulUserAction) {
    reasons.push("Surface lacks a legitimate, actionable user pathway.");
    return { state: "NEEDS_EVIDENCE", isIndexable: false, reasons };
  }

  // Minimum substantive threshold
  if (totalInventory < 2) {
    reasons.push("Inventory is too thin to qualify as a primary search landing page.");
    return { state: "NEEDS_EVIDENCE", isIndexable: false, reasons };
  }

  return {
    state: "INDEXABLE",
    isIndexable: true,
    reasons: ["Sufficient fresh local evidence and actionable pathways verified."],
  };
}
