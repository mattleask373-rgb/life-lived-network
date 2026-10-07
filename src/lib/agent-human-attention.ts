/**
 * Human attention queue — what to surface when humans return after offline hours.
 */

export type AttentionKind =
  | "APPROVAL_REQUIRED"
  | "DECISION_REQUIRED"
  | "AMBIGUITY_DETECTED"
  | "SECURITY_REVIEW_REQUIRED"
  | "PRODUCTION_ACTION_REQUIRED"
  | "CONFLICT_DETECTED"
  | "EVIDENCE_INSUFFICIENT"
  | "HIGH_RISK_CHANGE";

export interface HumanAttentionItem {
  id: string;
  projectId: string;
  kind: AttentionKind;
  summary: string;
  whyItMatters: string;
  evidenceRefs: string[];
  decisionNeeded: string;
  ifWaitConsequence: string;
  safeOptions: string[];
  createdAt: string;
  blocking: boolean;
}

export function buildAttentionItem(
  partial: Omit<HumanAttentionItem, "id" | "createdAt"> & { id?: string },
): HumanAttentionItem {
  return {
    id: partial.id ?? `HA-${partial.projectId}-${partial.kind}`,
    projectId: partial.projectId,
    kind: partial.kind,
    summary: partial.summary,
    whyItMatters: partial.whyItMatters,
    evidenceRefs: partial.evidenceRefs,
    decisionNeeded: partial.decisionNeeded,
    ifWaitConsequence: partial.ifWaitConsequence,
    safeOptions: partial.safeOptions,
    createdAt: new Date().toISOString(),
    blocking: partial.blocking,
  };
}

/** Work agents may continue while humans are offline. */
export const OFFLINE_SAFE_WORK: readonly string[] = [
  "research",
  "analysis",
  "documentation",
  "tests",
  "safe_implementation_on_branch",
  "seo_analysis",
  "backlog_refinement",
  "evidence_gathering",
  "ci_diagnosis",
  "draft_work",
] as const;

/** Must queue for humans — never auto-execute. */
export const OFFLINE_QUEUED_FOR_HUMAN: readonly string[] = [
  "production_deployment",
  "external_publication",
  "major_architecture_decision",
  "destructive_migration",
  "security_sensitive_decision",
  "financial_action",
  "irreversible_change",
  "final_integration_to_main",
] as const;

export function isOfflineSafe(workType: string): boolean {
  return (OFFLINE_SAFE_WORK as readonly string[]).includes(workType);
}

export function mustQueueForHuman(workType: string): boolean {
  return (OFFLINE_QUEUED_FOR_HUMAN as readonly string[]).includes(workType);
}
