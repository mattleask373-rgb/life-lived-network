import type { AutonomyLevel, RiskLevel } from "./agent-orchestration";

/**
 * Phase 4 — Crash-safe reconciliation kernel
 *
 * Pure, deterministic recovery decisions for stale leases, orphaned attempts,
 * and expired claims. This module never claims a lease, calls a provider,
 * mutates durable state, consumes approvals, merges, deploys, or infers
 * missing external facts.
 *
 * All decisions are explicit HOLD / RECOVER / RELEASE so the durable control
 * plane remains the single source of truth.
 */

export type AttemptStatus =
  | "DISPATCHED"
  | "RUNNING"
  | "VERIFYING"
  | "FAILED"
  | "SUCCEEDED"
  | "ABANDONED";

export type LeaseSnapshot = Readonly<{
  taskId: string;
  attemptId: string | null;
  runId: string;
  actorId: string;
  workspaceId: string;
  projectId: string;
  leaseGeneration: number;
  leaseToken: string;
  leaseExpiry: string; // ISO
  attemptStatus: AttemptStatus | null;
  lastHeartbeatAt: string | null; // ISO
  correlationId: string;
}>;

export type CrashSafePolicy = Readonly<{
  /** Maximum age of a lease without heartbeat before it is considered stale. */
  staleLeaseMs: number;
  /** Maximum age of a DISPATCHED/RUNNING attempt without progress. */
  orphanedAttemptMs: number;
  allowedWorkspaces: readonly string[];
  allowedProjects: readonly string[];
  allowedAutonomy: readonly AutonomyLevel[];
  humanGatedRisks: readonly RiskLevel[];
}>;

export type RecoveryDecision =
  | Readonly<{
      kind: "HOLD";
      taskId: string;
      reason: string;
    }>
  | Readonly<{
      kind: "RELEASE_STALE_LEASE";
      taskId: string;
      attemptId: string | null;
      leaseGeneration: number;
      leaseToken: string;
      reason: string;
    }>
  | Readonly<{
      kind: "MARK_ATTEMPT_ABANDONED";
      taskId: string;
      attemptId: string;
      reason: string;
    }>
  | Readonly<{
      kind: "RECOVER_READY";
      taskId: string;
      previousAttemptId: string | null;
      reason: string;
    }>;

export type CrashSafeInput = Readonly<{
  now: string; // ISO
  runId: string;
  actorId: string;
  leases: readonly LeaseSnapshot[];
  policy: CrashSafePolicy;
}>;

function hold(taskId: string, reason: string): RecoveryDecision {
  return { kind: "HOLD", taskId, reason };
}

function msSince(iso: string, now: string): number {
  return new Date(now).getTime() - new Date(iso).getTime();
}

/**
 * Pure crash-safe reconciliation.
 *
 * Evaluates durable lease/attempt snapshots and emits explicit recovery
 * decisions. Never mutates state. Never calls providers. Never auto-promotes
 * any attempt to DONE/ACCEPTED/INTEGRATED.
 */
export function reconcileCrashSafe(input: CrashSafeInput): readonly RecoveryDecision[] {
  const decisions: RecoveryDecision[] = [];
  const seen = new Set<string>();

  for (const lease of input.leases) {
    const taskId = lease.taskId;

    if (seen.has(taskId)) {
      decisions.push(hold(taskId, "duplicate lease snapshot in crash-safe input"));
      continue;
    }
    seen.add(taskId);

    // Scope fencing
    if (!input.policy.allowedWorkspaces.includes(lease.workspaceId)) {
      decisions.push(hold(taskId, "workspace outside crash-safe supervisor scope"));
      continue;
    }
    if (!input.policy.allowedProjects.includes(lease.projectId)) {
      decisions.push(hold(taskId, "project outside crash-safe supervisor scope"));
      continue;
    }

    // Actor / run fencing — only the owning run may recover its own leases
    if (lease.runId !== input.runId) {
      decisions.push(hold(taskId, "lease belongs to a different run; refuse cross-run recovery"));
      continue;
    }

    const expired = msSince(lease.leaseExpiry, input.now) > 0;
    const lastBeat = lease.lastHeartbeatAt ?? lease.leaseExpiry;
    const staleByHeartbeat = msSince(lastBeat, input.now) > input.policy.staleLeaseMs;

    // Case 1: lease expired or heartbeat-stale → release
    if (expired || staleByHeartbeat) {
      decisions.push({
        kind: "RELEASE_STALE_LEASE",
        taskId,
        attemptId: lease.attemptId,
        leaseGeneration: lease.leaseGeneration,
        leaseToken: lease.leaseToken,
        reason: expired
          ? `lease expired at ${lease.leaseExpiry}`
          : `no heartbeat for >${input.policy.staleLeaseMs}ms (last=${lastBeat})`,
      });

      // If there was an in-flight attempt, mark it abandoned so it cannot be
      // silently treated as success later.
      if (
        lease.attemptId &&
        (lease.attemptStatus === "DISPATCHED" ||
          lease.attemptStatus === "RUNNING" ||
          lease.attemptStatus === "VERIFYING")
      ) {
        decisions.push({
          kind: "MARK_ATTEMPT_ABANDONED",
          taskId,
          attemptId: lease.attemptId,
          reason: "attempt left in non-terminal state after lease release",
        });
      }

      // After release the task can become READY again for a future reconcile.
      decisions.push({
        kind: "RECOVER_READY",
        taskId,
        previousAttemptId: lease.attemptId,
        reason: "stale lease released; task returned to recoverable READY surface",
      });
      continue;
    }

    // Case 2: lease still valid but attempt is orphaned (no progress)
    if (
      lease.attemptId &&
      (lease.attemptStatus === "DISPATCHED" || lease.attemptStatus === "RUNNING") &&
      lease.lastHeartbeatAt &&
      msSince(lease.lastHeartbeatAt, input.now) > input.policy.orphanedAttemptMs
    ) {
      decisions.push({
        kind: "MARK_ATTEMPT_ABANDONED",
        taskId,
        attemptId: lease.attemptId,
        reason: `attempt orphaned: no progress for >${input.policy.orphanedAttemptMs}ms`,
      });
      decisions.push({
        kind: "RELEASE_STALE_LEASE",
        taskId,
        attemptId: lease.attemptId,
        leaseGeneration: lease.leaseGeneration,
        leaseToken: lease.leaseToken,
        reason: "orphaned attempt forces lease release",
      });
      decisions.push({
        kind: "RECOVER_READY",
        taskId,
        previousAttemptId: lease.attemptId,
        reason: "orphaned attempt abandoned; task recoverable",
      });
      continue;
    }

    // Case 3: healthy lease / attempt — hold (do not touch)
    decisions.push(
      hold(
        taskId,
        `lease generation ${lease.leaseGeneration} still valid until ${lease.leaseExpiry}; no recovery required`,
      ),
    );
  }

  return decisions;
}
