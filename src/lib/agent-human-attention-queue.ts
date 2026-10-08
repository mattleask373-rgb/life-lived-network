/**
 * Phase 6 — Human attention priority queue
 *
 * Pure policy: turns control-plane signals into ordered items humans must see.
 * Does not consume approvals, write durable state, merge, deploy, or go LIVE.
 */

import {
  buildAttentionItem,
  type AttentionKind,
  type HumanAttentionItem,
  mustQueueForHuman,
  isOfflineSafe,
} from "./agent-human-attention";

export type AttentionSignal =
  | Readonly<{
      type: "FENCE_REJECT";
      projectId: string;
      taskId: string;
      attemptId: string;
      code: string;
      reason: string;
    }>
  | Readonly<{
      type: "EVIDENCE_INSUFFICIENT";
      projectId: string;
      taskId: string;
      gaps: readonly string[];
    }>
  | Readonly<{
      type: "HUMAN_GATED_RISK";
      projectId: string;
      taskId: string;
      risk: string;
      reason: string;
    }>
  | Readonly<{
      type: "PRODUCTION_BOUNDARY";
      projectId: string;
      workType: string;
      summary: string;
    }>
  | Readonly<{
      type: "SECURITY_REVIEW";
      projectId: string;
      summary: string;
      evidenceRefs: readonly string[];
    }>
  | Readonly<{
      type: "CONFLICT";
      projectId: string;
      taskId: string;
      summary: string;
    }>;

const PRIORITY: Record<AttentionKind, number> = {
  SECURITY_REVIEW_REQUIRED: 0,
  PRODUCTION_ACTION_REQUIRED: 1,
  APPROVAL_REQUIRED: 2,
  HIGH_RISK_CHANGE: 3,
  CONFLICT_DETECTED: 4,
  EVIDENCE_INSUFFICIENT: 5,
  AMBIGUITY_DETECTED: 6,
  DECISION_REQUIRED: 7,
};

function kindFor(signal: AttentionSignal): AttentionKind {
  switch (signal.type) {
    case "FENCE_REJECT":
      return signal.code === "GENERATION_MISMATCH" || signal.code === "TOKEN_MISMATCH"
        ? "SECURITY_REVIEW_REQUIRED"
        : "CONFLICT_DETECTED";
    case "EVIDENCE_INSUFFICIENT":
      return "EVIDENCE_INSUFFICIENT";
    case "HUMAN_GATED_RISK":
      return signal.risk === "P0" || signal.risk === "P1" ? "HIGH_RISK_CHANGE" : "APPROVAL_REQUIRED";
    case "PRODUCTION_BOUNDARY":
      return "PRODUCTION_ACTION_REQUIRED";
    case "SECURITY_REVIEW":
      return "SECURITY_REVIEW_REQUIRED";
    case "CONFLICT":
      return "CONFLICT_DETECTED";
  }
}

function toItem(signal: AttentionSignal): HumanAttentionItem {
  const kind = kindFor(signal);

  switch (signal.type) {
    case "FENCE_REJECT":
      return buildAttentionItem({
        projectId: signal.projectId,
        kind,
        summary: `Attempt fence rejected on task ${signal.taskId}: ${signal.code}`,
        whyItMatters:
          "A stale or mismatched worker tried to complete work after reclaim or under the wrong identity/scope.",
        evidenceRefs: [signal.taskId, signal.attemptId, signal.code],
        decisionNeeded: "Confirm reclaim completed cleanly; abandon stale attempt; do not accept its evidence.",
        ifWaitConsequence: "Stale evidence may be confused with current-generation work in logs.",
        safeOptions: [
          "Mark attempt abandoned",
          "Inspect audit trail for generation mismatch",
          "Continue offline-safe work only",
        ],
        blocking: kind === "SECURITY_REVIEW_REQUIRED",
      });
    case "EVIDENCE_INSUFFICIENT":
      return buildAttentionItem({
        projectId: signal.projectId,
        kind,
        summary: `Evidence insufficient for task ${signal.taskId}`,
        whyItMatters: "Provider or verifier could not support claims; governance must not promote the task.",
        evidenceRefs: [signal.taskId, ...signal.gaps],
        decisionNeeded: "Require additional evidence or send back to IMPLEMENTATION.",
        ifWaitConsequence: "Task stays in VERIFYING/HOLD; no silent DONE.",
        safeOptions: ["Request more tests", "Request changed-path evidence", "Hold for human review"],
        blocking: false,
      });
    case "HUMAN_GATED_RISK":
      return buildAttentionItem({
        projectId: signal.projectId,
        kind,
        summary: `Risk ${signal.risk} gated on task ${signal.taskId}`,
        whyItMatters: signal.reason,
        evidenceRefs: [signal.taskId, signal.risk],
        decisionNeeded: "Explicit human go/no-go before dispatch.",
        ifWaitConsequence: "Supervisor continues to HOLD; no automatic execution.",
        safeOptions: ["Approve with scope notes", "Reject", "Downgrade scope and re-queue"],
        blocking: true,
      });
    case "PRODUCTION_BOUNDARY":
      return buildAttentionItem({
        projectId: signal.projectId,
        kind,
        summary: signal.summary,
        whyItMatters: `Work type ${signal.workType} is on the offline-queued-for-human list.`,
        evidenceRefs: [signal.workType],
        decisionNeeded: "Human must authorize any production-side effect.",
        ifWaitConsequence: "No production mutation occurs.",
        safeOptions: ["Authorize with checklist", "Defer", "Convert to branch-only work"],
        blocking: true,
      });
    case "SECURITY_REVIEW":
      return buildAttentionItem({
        projectId: signal.projectId,
        kind,
        summary: signal.summary,
        whyItMatters: "Security-sensitive change requires independent review.",
        evidenceRefs: [...signal.evidenceRefs],
        decisionNeeded: "Independent reviewer sign-off before integration.",
        ifWaitConsequence: "Change remains on branch; not integrated.",
        safeOptions: ["Request review", "Add tests", "Hold"],
        blocking: true,
      });
    case "CONFLICT":
      return buildAttentionItem({
        projectId: signal.projectId,
        kind,
        summary: signal.summary,
        whyItMatters: "Competing or inconsistent control-plane signals on the same task.",
        evidenceRefs: [signal.taskId],
        decisionNeeded: "Reconcile source of truth before further dispatch.",
        ifWaitConsequence: "Supervisor should HOLD the task.",
        safeOptions: ["Inspect durable state", "Mark STALE if needed", "HOLD"],
        blocking: false,
      });
  }
}

/**
 * Build a priority-sorted attention queue from signals.
 * Blocking items sort first within the same priority band by kind order.
 */
export function buildAttentionQueue(signals: readonly AttentionSignal[]): HumanAttentionItem[] {
  const items = signals.map(toItem);
  return items.sort((a, b) => {
    const pa = PRIORITY[a.kind] ?? 99;
    const pb = PRIORITY[b.kind] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/**
 * Gate a proposed work type before any executor would act.
 * Returns QUEUE_FOR_HUMAN or CONTINUE_OFFLINE_SAFE or UNKNOWN_HOLD.
 */
export function gateWorkType(
  workType: string,
): Readonly<{ action: "CONTINUE_OFFLINE_SAFE" | "QUEUE_FOR_HUMAN" | "UNKNOWN_HOLD"; reason: string }> {
  if (mustQueueForHuman(workType)) {
    return {
      action: "QUEUE_FOR_HUMAN",
      reason: `${workType} is on the offline human-gated list; automation must stop`,
    };
  }
  if (isOfflineSafe(workType)) {
    return {
      action: "CONTINUE_OFFLINE_SAFE",
      reason: `${workType} is offline-safe under policy`,
    };
  }
  return {
    action: "UNKNOWN_HOLD",
    reason: `${workType} is not classified; fail closed until human policy updates`,
  };
}
