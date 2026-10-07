/**
 * Research → product boundary.
 * Research must never silently become product truth.
 *
 * Labels:
 * - KNOWN: directly supported by cited sources
 * - INFERRED: reasonable interpretation, still not product requirement
 * - PROPOSED: candidate opportunity or experiment
 * - UNKNOWN: explicitly unresolved
 */

export type EvidenceConfidence = "KNOWN" | "INFERRED" | "PROPOSED" | "UNKNOWN";

export interface ResearchSource {
  title: string;
  url?: string;
  retrievedAt: string;
  notes?: string;
}

export interface ResearchFinding {
  id: string;
  statement: string;
  confidence: EvidenceConfidence;
  sources: ResearchSource[];
  limitations: string[];
  /** Must remain false until a product decision promotes it. */
  isProductRequirement: boolean;
  suggestedNext?: string;
}

export type ResearchValidationIssue =
  | { code: "MISSING_ID"; message: string }
  | { code: "EMPTY_STATEMENT"; message: string }
  | { code: "KNOWN_WITHOUT_SOURCE"; message: string }
  | { code: "PROMOTED_WITHOUT_KNOWN"; message: string }
  | { code: "UNKNOWN_MARKED_REQUIREMENT"; message: string };

export function validateResearchFinding(finding: ResearchFinding): ResearchValidationIssue[] {
  const issues: ResearchValidationIssue[] = [];
  if (!finding.id?.trim()) {
    issues.push({ code: "MISSING_ID", message: "finding id is required" });
  }
  if (!finding.statement?.trim()) {
    issues.push({ code: "EMPTY_STATEMENT", message: "statement is required" });
  }
  if (finding.confidence === "KNOWN" && (!finding.sources || finding.sources.length === 0)) {
    issues.push({
      code: "KNOWN_WITHOUT_SOURCE",
      message: "KNOWN findings require at least one source",
    });
  }
  if (finding.isProductRequirement && finding.confidence !== "KNOWN") {
    issues.push({
      code: "PROMOTED_WITHOUT_KNOWN",
      message:
        "only KNOWN findings may be marked isProductRequirement (and still need product decision)",
    });
  }
  if (finding.confidence === "UNKNOWN" && finding.isProductRequirement) {
    issues.push({
      code: "UNKNOWN_MARKED_REQUIREMENT",
      message: "UNKNOWN must never become a product requirement",
    });
  }
  return issues;
}

export function isSafeResearchFinding(finding: ResearchFinding): boolean {
  return validateResearchFinding(finding).length === 0;
}

/**
 * Promote path is explicit and multi-step. This helper only describes the next safe step;
 * it does not mutate product truth.
 */
export function nextSafeStepFromFinding(finding: ResearchFinding): string {
  if (finding.confidence === "UNKNOWN") {
    return "Gather sources; keep UNKNOWN visible; do not schedule implementation";
  }
  if (finding.confidence === "INFERRED" || finding.confidence === "PROPOSED") {
    return "Create product opportunity task for human/product review; do not implement yet";
  }
  if (finding.confidence === "KNOWN" && !finding.isProductRequirement) {
    return "Product decision required before implementation task";
  }
  return "Product-accepted requirement may spawn implementation task with acceptance criteria";
}
