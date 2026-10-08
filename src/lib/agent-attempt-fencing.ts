/**
 * Attempt-level fencing.
 *
 * A task-level lease is not sufficient. After reclaim:
 *
 *   task → STALE → reclaim → lease generation N+1 → attempt B
 *
 * attempt A (generation N) must not be able to complete, report success,
 * or mutate the new attempt's outcome.
 *
 * This module is pure policy. It never writes durable state.
 */

import { canFence, type LeaseSnapshot } from "./agent-lease-policy";

export type AttemptTerminalIntent =
  | "VERIFYING"
  | "FAILED"
  | "PARTIAL"
  | "BLOCKED"
  | "ABANDONED";

export type AttemptRecord = Readonly<{
  attemptId: string;
  taskId: string;
  runId: string;
  workspaceId: string;
  projectId: string;
  /** Lease generation at the moment the attempt was created. */
  leaseGeneration: number;
  /** Lease token at the moment the attempt was created. */
  leaseToken: string;
  status: "DISPATCHED" | "RUNNING" | "VERIFYING" | "FAILED" | "SUCCEEDED" | "ABANDONED" | "CANCELLED";
  correlationId: string;
  actorId: string;
}>;

export type AttemptCompletionRequest = Readonly<{
  attempt: AttemptRecord;
  /** Current durable lease on the task (post any reclaim). */
  currentLease: LeaseSnapshot;
  /** Intended terminal/progress status for this attempt. */
  intent: AttemptTerminalIntent;
  /** Actor presenting the completion. */
  actorId: string;
  /** Workspace/project claimed by the caller (must match attempt). */
  workspaceId: string;
  projectId: string;
}>;

export type AttemptCompletionDecision =
  | Readonly<{ allowed: true; reason: string }>
  | Readonly<{ allowed: false; reason: string; code: AttemptFenceRejectCode }>;

export type AttemptFenceRejectCode =
  | "GENERATION_MISMATCH"
  | "TOKEN_MISMATCH"
  | "ATTEMPT_NOT_ACTIVE"
  | "ATTEMPT_CANCELLED"
  | "ATTEMPT_ALREADY_TERMINAL"
  | "ACTOR_MISMATCH"
  | "SCOPE_MISMATCH"
  | "TASK_MISMATCH"
  | "LEASE_NOT_OWNED"
  | "FORBIDDEN_INTENT";

const ACTIVE_ATTEMPT_STATUSES = new Set(["DISPATCHED", "RUNNING", "VERIFYING"]);
const TERMINAL_ATTEMPT_STATUSES = new Set(["FAILED", "SUCCEEDED", "ABANDONED", "CANCELLED"]);

/**
 * Authorize whether an attempt may record a completion / progress outcome
 * against the current durable lease.
 *
 * Rules:
 * 1. Attempt taskId must match current lease taskId.
 * 2. Attempt leaseGeneration + leaseToken must match current lease fence.
 * 3. Attempt must still be in an active (non-terminal) status.
 * 4. Actor must be the attempt actor (or system reclaim path is separate).
 * 5. Workspace and project must match the attempt record.
 * 6. Intent must be a provider-safe outcome (never DONE/ACCEPTED/INTEGRATED).
 */
export function authorizeAttemptCompletion(
  req: AttemptCompletionRequest,
): AttemptCompletionDecision {
  const { attempt, currentLease, intent, actorId, workspaceId, projectId } = req;

  if (attempt.taskId !== currentLease.taskId) {
    return {
      allowed: false,
      code: "TASK_MISMATCH",
      reason: `attempt task ${attempt.taskId} does not match lease task ${currentLease.taskId}`,
    };
  }

  if (attempt.workspaceId !== workspaceId || attempt.projectId !== projectId) {
    return {
      allowed: false,
      code: "SCOPE_MISMATCH",
      reason: "workspace or project does not match the attempt record",
    };
  }

  if (attempt.status === "CANCELLED") {
    return {
      allowed: false,
      code: "ATTEMPT_CANCELLED",
      reason: "cancelled attempt cannot complete or report outcome",
    };
  }

  if (TERMINAL_ATTEMPT_STATUSES.has(attempt.status) && attempt.status !== "VERIFYING") {
    // SUCCEEDED/FAILED/ABANDONED are terminal; VERIFYING is still progress
    if (attempt.status !== "VERIFYING") {
      return {
        allowed: false,
        code: "ATTEMPT_ALREADY_TERMINAL",
        reason: `attempt is already terminal (${attempt.status})`,
      };
    }
  }

  if (!ACTIVE_ATTEMPT_STATUSES.has(attempt.status)) {
    return {
      allowed: false,
      code: "ATTEMPT_NOT_ACTIVE",
      reason: `attempt status ${attempt.status} cannot accept completion`,
    };
  }

  if (attempt.actorId !== actorId) {
    return {
      allowed: false,
      code: "ACTOR_MISMATCH",
      reason: "actor is not the attempt owner",
    };
  }

  // Core fencing: generation + token must match the *current* lease.
  const fence = canFence(currentLease, attempt.leaseGeneration, attempt.leaseToken);
  if (!fence.ok) {
    if (currentLease.leaseGeneration !== attempt.leaseGeneration) {
      return {
        allowed: false,
        code: "GENERATION_MISMATCH",
        reason: `stale attempt generation ${attempt.leaseGeneration} rejected; current generation is ${currentLease.leaseGeneration}`,
      };
    }
    return {
      allowed: false,
      code: "TOKEN_MISMATCH",
      reason: fence.reason,
    };
  }

  // Provider outcomes must never be governance outcomes.
  if ((["DONE", "ACCEPTED", "INTEGRATED", "SUCCESS", "COMPLETE"] as string[]).includes(intent)) {
    return {
      allowed: false,
      code: "FORBIDDEN_INTENT",
      reason: `intent ${intent} is not a valid attempt completion outcome`,
    };
  }

  return {
    allowed: true,
    reason: `attempt ${attempt.attemptId} fenced at generation ${attempt.leaseGeneration}; completion authorized`,
  };
}

/**
 * After reclaim, any in-flight attempt from the previous generation must be
 * treated as non-authoritative. This helper documents the expected pure outcome
 * for tests and supervisors without mutating storage.
 */
export function isStaleGenerationAttempt(
  attempt: Pick<AttemptRecord, "leaseGeneration">,
  currentGeneration: number,
): boolean {
  return attempt.leaseGeneration !== currentGeneration;
}
