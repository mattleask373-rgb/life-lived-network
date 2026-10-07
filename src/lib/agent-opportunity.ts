/**
 * Unified opportunity pipeline for research, SEO, marketing, product, engineering.
 * SIGNAL → … → DECISION. Never auto-creates product requirements.
 */

import type { EvidenceConfidence } from "./agent-research-contract";

export type OpportunityStage =
  | "SIGNAL"
  | "HYPOTHESIS"
  | "EVIDENCE"
  | "OPPORTUNITY"
  | "DECISION"
  | "TASK_SPAWNED"
  | "REJECTED"
  | "DEFERRED";

export type OpportunityDomain = "research" | "seo" | "marketing" | "product" | "engineering" | "security" | "operations";

export interface OpportunityRecord {
  id: string;
  projectId: string;
  domain: OpportunityDomain;
  stage: OpportunityStage;
  statement: string;
  confidence: EvidenceConfidence;
  evidenceRefs: string[];
  /** Explicit product decision required before implementation tasks. */
  productDecision: "pending" | "accepted" | "rejected" | "not_applicable";
  createdByRole: string;
}

export function canAdvanceOpportunity(from: OpportunityStage, to: OpportunityStage): boolean {
  const order: OpportunityStage[] = [
    "SIGNAL",
    "HYPOTHESIS",
    "EVIDENCE",
    "OPPORTUNITY",
    "DECISION",
    "TASK_SPAWNED",
  ];
  if (to === "REJECTED" || to === "DEFERRED") {
    return from !== "TASK_SPAWNED" && from !== "REJECTED";
  }
  const fi = order.indexOf(from);
  const ti = order.indexOf(to);
  return fi >= 0 && ti === fi + 1;
}

/**
 * Only after explicit productDecision=accepted may work become executable tasks.
 * UNKNOWN/PROPOSED confidence cannot reach TASK_SPAWNED.
 */
export function canSpawnTaskFromOpportunity(opp: OpportunityRecord): {
  ok: boolean;
  reason: string;
} {
  if (opp.stage !== "DECISION" && opp.stage !== "OPPORTUNITY") {
    return { ok: false, reason: `stage ${opp.stage} cannot spawn tasks` };
  }
  if (opp.productDecision !== "accepted" && opp.productDecision !== "not_applicable") {
    return { ok: false, reason: "product decision not accepted" };
  }
  if (opp.confidence === "UNKNOWN" || opp.confidence === "PROPOSED") {
    return { ok: false, reason: "confidence too weak to spawn implementation" };
  }
  if (opp.confidence === "INFERRED" && opp.domain !== "engineering") {
    return { ok: false, reason: "INFERRED non-engineering needs product acceptance as KNOWN path" };
  }
  return { ok: true, reason: "eligible to spawn candidate task" };
}
