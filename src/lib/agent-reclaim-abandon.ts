/**
 * Reclaim-side attempt abandonment policy (pure).
 *
 * After reclaim advances task lease generation N → N+1, every in-flight
 * attempt bound to generation N must be treated as non-authoritative and
 * marked ABANDONED before a new attempt is created.
 *
 * This module does not write durable state. The durable reclaim RPC should
 * apply these decisions under the same transaction as generation rotation.
 */

export type ReclaimAttemptSnapshot = Readonly<{
  attemptId: string;
  taskId: string;
  leaseGeneration: number;
  status: "DISPATCHED" | "RUNNING" | "VERIFYING" | "FAILED" | "SUCCEEDED" | "ABANDONED" | "CANCELLED";
}>;

export type ReclaimAbandonDecision =
  | Readonly<{ kind: "ABANDON"; attemptId: string; reason: string }>
  | Readonly<{ kind: "HOLD"; attemptId: string; reason: string }>;

const ACTIVE = new Set(["DISPATCHED", "RUNNING", "VERIFYING"]);

/**
 * Given the new (post-reclaim) lease generation and the attempts still
 * attached to the task, decide which attempts must be abandoned.
 */
export function decideReclaimAbandon(
  newLeaseGeneration: number,
  attempts: readonly ReclaimAttemptSnapshot[],
): readonly ReclaimAbandonDecision[] {
  if (!Number.isSafeInteger(newLeaseGeneration) || newLeaseGeneration < 1) {
    throw new Error("newLeaseGeneration must be a positive integer");
  }

  return attempts.map((attempt) => {
    if (attempt.status === "ABANDONED" || attempt.status === "CANCELLED") {
      return {
        kind: "HOLD",
        attemptId: attempt.attemptId,
        reason: `attempt already ${attempt.status}`,
      };
    }

    if (attempt.status === "SUCCEEDED" || attempt.status === "FAILED") {
      return {
        kind: "HOLD",
        attemptId: attempt.attemptId,
        reason: `terminal attempt ${attempt.status} remains history; do not rewrite`,
      };
    }

    if (attempt.leaseGeneration >= newLeaseGeneration) {
      return {
        kind: "HOLD",
        attemptId: attempt.attemptId,
        reason: "attempt already belongs to current or newer generation",
      };
    }

    if (!ACTIVE.has(attempt.status)) {
      return {
        kind: "HOLD",
        attemptId: attempt.attemptId,
        reason: `status ${attempt.status} is not an active reclaim target`,
      };
    }

    return {
      kind: "ABANDON",
      attemptId: attempt.attemptId,
      reason: `stale generation ${attempt.leaseGeneration} after reclaim to ${newLeaseGeneration}`,
    };
  });
}
