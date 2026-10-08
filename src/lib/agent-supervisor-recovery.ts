import { evaluateStale, type LeaseSnapshot } from "./agent-lease-policy";

export type RecoveryAttemptStatus =
  | "DISPATCHED"
  | "RUNNING"
  | "VERIFYING"
  | "SUCCEEDED"
  | "FAILED"
  | "STALE"
  | "CANCELLED";

export type RecoveryTaskSnapshot = Readonly<{
  taskId: string;
  status: "CLAIMED" | "IN_PROGRESS" | "VERIFYING" | "READY" | "BLOCKED" | "CANCELLED";
  lease: LeaseSnapshot;
  activeAttemptId: string | null;
  activeAttemptStatus: RecoveryAttemptStatus | null;
  workspaceId: string;
  projectId: string | null;
}>;

export type RecoveryDecision =
  | Readonly<{
      kind: "MARK_STALE";
      taskId: string;
      reason: string;
    }>
  | Readonly<{
      kind: "RECLAIM";
      taskId: string;
      workspaceId: string;
      projectId: string;
      reason: string;
    }>
  | Readonly<{
      kind: "HOLD";
      taskId: string;
      reason: string;
    }>;

/**
 * Pure crash-recovery kernel.
 *
 * It never mutates durable state. The caller must apply MARK_STALE through the
 * authoritative system transition, then reclaim with a fresh lease generation
 * and token. A stale worker must never be revived by this decision function.
 */
export function reconcileRecovery(
  snapshots: readonly RecoveryTaskSnapshot[],
  now: Date,
  heartbeatGraceMs: number,
): readonly RecoveryDecision[] {
  return snapshots.map((snapshot) => {
    if (snapshot.status === "CANCELLED") {
      return { kind: "HOLD", taskId: snapshot.taskId, reason: "cancelled work cannot be resurrected" };
    }

    if (!snapshot.projectId?.trim()) {
      return { kind: "HOLD", taskId: snapshot.taskId, reason: "project scope is required for recovery" };
    }

    if (!snapshot.activeAttemptId) {
      return { kind: "HOLD", taskId: snapshot.taskId, reason: "no active attempt is attached to the lease" };
    }

    if (snapshot.activeAttemptStatus === "SUCCEEDED") {
      return { kind: "HOLD", taskId: snapshot.taskId, reason: "successful attempt requires verification, not reclaim" };
    }

    if (snapshot.activeAttemptStatus === "CANCELLED") {
      return { kind: "HOLD", taskId: snapshot.taskId, reason: "cancelled attempt cannot be silently retried" };
    }

    const stale = evaluateStale(snapshot.lease, now, heartbeatGraceMs);
    if (!stale.isStale) {
      return { kind: "HOLD", taskId: snapshot.taskId, reason: stale.reason };
    }

    return {
      kind: "MARK_STALE",
      taskId: snapshot.taskId,
      reason: stale.reason,
    };
  });
}

/**
 * Once the authoritative DB transition has moved a task to STALE, a separate
 * deterministic gate permits reclamation. This keeps stale marking and new
 * ownership as distinct lifecycle events.
 */
export function authorizeReclaim(
  snapshot: Pick<RecoveryTaskSnapshot, "taskId" | "status" | "workspaceId" | "projectId">,
): RecoveryDecision {
  if (snapshot.status !== "READY" && snapshot.status !== "BLOCKED") {
    return { kind: "HOLD", taskId: snapshot.taskId, reason: "reclaim requires an authoritative STALE state" };
  }
  if (!snapshot.projectId?.trim()) {
    return { kind: "HOLD", taskId: snapshot.taskId, reason: "project scope is required for reclaim" };
  }
  return {
    kind: "RECLAIM",
    taskId: snapshot.taskId,
    workspaceId: snapshot.workspaceId,
    projectId: snapshot.projectId,
    reason: "task is stale and eligible for a fresh fenced ownership attempt",
  };
}
