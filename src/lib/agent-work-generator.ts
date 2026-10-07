/**
 * Controlled work generation: signals produce CandidateWork, not requirements.
 */

import type { EvidenceConfidence } from "./agent-research-contract";
import type { RiskLevel } from "./agent-orchestration";

export type WorkSourceKind =
  | "product_roadmap"
  | "user_feedback"
  | "research_finding"
  | "ci_failure"
  | "security_finding"
  | "tech_debt"
  | "seo_opportunity"
  | "marketing_experiment"
  | "analytics"
  | "competitor_intelligence"
  | "documentation_gap"
  | "stale_dependency"
  | "unfinished_handoff"
  | "blocked_task"
  | "human_request"
  | "incident";

export interface CandidateWork {
  id: string;
  projectId: string;
  source: WorkSourceKind;
  title: string;
  rationale: string;
  confidence: EvidenceConfidence;
  suggestedRisk: RiskLevel;
  suggestedRoleCapabilities: string[];
  /** Always false at generation time — promotion is a separate decision. */
  isConfirmedRequirement: false;
  requiresHumanDecision: boolean;
}

export interface WorkSignal {
  projectId: string;
  source: WorkSourceKind;
  title: string;
  rationale: string;
  confidence: EvidenceConfidence;
  suggestedRisk?: RiskLevel;
  suggestedRoleCapabilities?: string[];
}

let seq = 0;

export function generateCandidateWork(signal: WorkSignal): CandidateWork {
  seq += 1;
  const highTouch =
    signal.source === "security_finding" ||
    signal.source === "human_request" ||
    signal.confidence === "UNKNOWN" ||
    signal.confidence === "PROPOSED";

  return {
    id: `CW-${signal.projectId}-${seq}`,
    projectId: signal.projectId,
    source: signal.source,
    title: signal.title,
    rationale: signal.rationale,
    confidence: signal.confidence,
    suggestedRisk: signal.suggestedRisk ?? "P2",
    suggestedRoleCapabilities: signal.suggestedRoleCapabilities ?? [],
    isConfirmedRequirement: false,
    requiresHumanDecision: highTouch,
  };
}

export function promoteCandidateToRequirement(
  candidate: CandidateWork,
  actor: string,
): { ok: boolean; reason: string } {
  if (!actor.startsWith("human") && actor !== "product_strategy") {
    return { ok: false, reason: "only human or product_strategy may promote requirements" };
  }
  if (candidate.confidence === "UNKNOWN") {
    return { ok: false, reason: "UNKNOWN cannot become a requirement" };
  }
  if (candidate.isConfirmedRequirement) {
    return { ok: false, reason: "already confirmed" };
  }
  return { ok: true, reason: "promotion allowed (caller must persist decision)" };
}
