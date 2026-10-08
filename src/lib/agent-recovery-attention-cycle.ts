/**
 * Pure recovery → reclaim gate → human attention cycle planner.
 *
 * Does not mutate durable state, call providers, merge, or deploy.
 * Callers apply MARK_STALE / reclaim RPCs separately under service_role.
 */

import {
  reconcileRecovery,
  authorizeReclaim,
  type RecoveryTaskSnapshot,
  type RecoveryDecision,
} from "./agent-supervisor-recovery";
import { decideReclaimAbandon, type ReclaimAttemptSnapshot } from "./agent-reclaim-abandon";
import {
  buildAttentionQueue,
  type AttentionSignal,
} from "./agent-human-attention-queue";
import type { HumanAttentionItem } from "./agent-human-attention";

export type RecoveryCycleInput = Readonly<{
  now: Date;
  heartbeatGraceMs: number;
  snapshots: readonly RecoveryTaskSnapshot[];
  /** Attempts attached to tasks that may be reclaimed (for abandon plan). */
  attemptsByTaskId?: ReadonlyMap<string, readonly ReclaimAttemptSnapshot[]>;
}>;

export type RecoveryCyclePlan = Readonly<{
  recoveryDecisions: readonly RecoveryDecision[];
  reclaimDecisions: readonly RecoveryDecision[];
  abandonPlans: readonly {
    taskId: string;
    newLeaseGeneration: number;
    decisions: ReturnType<typeof decideReclaimAbandon>;
  }[];
  attention: readonly HumanAttentionItem[];
  summary: string;
}>;

export function planRecoveryAttentionCycle(input: RecoveryCycleInput): RecoveryCyclePlan {
  const recoveryDecisions = reconcileRecovery(
    input.snapshots,
    input.now,
    input.heartbeatGraceMs,
  );

  const reclaimDecisions = input.snapshots
    .filter((s) => s.status === "STALE")
    .map((s) => authorizeReclaim(s));

  const abandonPlans: RecoveryCyclePlan["abandonPlans"] = [];
  for (const d of reclaimDecisions) {
    if (d.kind !== "RECLAIM") continue;
    const snapshot = input.snapshots.find((s) => s.taskId === d.taskId);
    if (!snapshot?.lease) continue;
    const newGen = (snapshot.lease.leaseGeneration ?? 0) + 1;
    const attempts = input.attemptsByTaskId?.get(d.taskId) ?? [];
    abandonPlans.push({
      taskId: d.taskId,
      newLeaseGeneration: newGen,
      decisions: decideReclaimAbandon(newGen, attempts),
    });
  }

  const signals: AttentionSignal[] = [];

  for (const d of recoveryDecisions) {
    if (d.kind === "MARK_STALE") {
      signals.push({
        type: "CONFLICT",
        projectId: input.snapshots.find((s) => s.taskId === d.taskId)?.projectId ?? "unknown",
        taskId: d.taskId,
        summary: `Lease recovery recommends MARK_STALE: ${d.reason}`,
      });
    }
  }

  for (const d of reclaimDecisions) {
    if (d.kind === "HOLD" && d.reason.includes("STALE")) {
      // expected hold paths are informational only
      continue;
    }
    if (d.kind === "RECLAIM") {
      signals.push({
        type: "SECURITY_REVIEW",
        projectId: d.projectId,
        summary: `Reclaim eligible for task ${d.taskId} (fresh generation required)`,
        evidenceRefs: [d.taskId, d.reason],
      });
    }
  }

  for (const plan of abandonPlans) {
    const abandoned = plan.decisions.filter((x) => x.kind === "ABANDON");
    if (abandoned.length > 0) {
      signals.push({
        type: "FENCE_REJECT",
        projectId:
          input.snapshots.find((s) => s.taskId === plan.taskId)?.projectId ?? "unknown",
        taskId: plan.taskId,
        attemptId: abandoned[0]!.attemptId,
        code: "GENERATION_MISMATCH",
        reason: `${abandoned.length} attempt(s) will be abandoned at generation ${plan.newLeaseGeneration}`,
      });
    }
  }

  const attention = buildAttentionQueue(signals);
  const markStale = recoveryDecisions.filter((d) => d.kind === "MARK_STALE").length;
  const reclaim = reclaimDecisions.filter((d) => d.kind === "RECLAIM").length;
  const abandon = abandonPlans.reduce(
    (n, p) => n + p.decisions.filter((d) => d.kind === "ABANDON").length,
    0,
  );

  return {
    recoveryDecisions,
    reclaimDecisions,
    abandonPlans,
    attention,
    summary: `recovery cycle: ${markStale} mark-stale, ${reclaim} reclaim, ${abandon} abandon, ${attention.length} attention; productionLive=false`,
  };
}
