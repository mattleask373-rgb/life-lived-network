/**
 * Non-production rehearsal loop — READY TO RUN in DRY_RUN / SHADOW only.
 *
 * productionLive is always false. LIVE mode is rejected at the API boundary.
 */

import { reconcileSupervisor, type ReconcileInput, type DispatchDecision } from "./agent-supervisor-reconcile";
import {
  reconcileRecovery,
  authorizeReclaim,
  type RecoveryTaskSnapshot,
  type RecoveryDecision,
} from "./agent-supervisor-recovery";
import {
  authorizeAttemptCompletion,
  type AttemptRecord,
  type AttemptCompletionDecision,
} from "./agent-attempt-fencing";
import type { LeaseSnapshot } from "./agent-lease-policy";
import type { ProviderExecutionEnvelope } from "./agent-provider-runtime";

export type RehearsalMode = "DRY_RUN" | "SHADOW";

export type RehearsalCycleInput = Readonly<{
  mode: RehearsalMode;
  now: string;
  reconcile: ReconcileInput;
  recoverySnapshots: readonly RecoveryTaskSnapshot[];
  heartbeatGraceMs: number;
  /** Optional in-flight attempts to exercise completion fencing. */
  attempts?: readonly {
    attempt: AttemptRecord;
    currentLease: LeaseSnapshot;
    intent: "VERIFYING" | "FAILED" | "PARTIAL" | "BLOCKED" | "ABANDONED";
    actorId: string;
    workspaceId: string;
    projectId: string;
  }[];
  shadowExecute?: () => Promise<ProviderExecutionEnvelope>;
}>;

export type RehearsalStep =
  | Readonly<{ step: "RECOVERY"; decisions: readonly RecoveryDecision[] }>
  | Readonly<{ step: "RECLAIM_GATE"; decisions: readonly RecoveryDecision[] }>
  | Readonly<{ step: "RECONCILE"; decisions: readonly DispatchDecision[] }>
  | Readonly<{ step: "ATTEMPT_FENCE"; decisions: readonly AttemptCompletionDecision[] }>
  | Readonly<{ step: "SHADOW_PROVIDER"; envelope: ProviderExecutionEnvelope }>
  | Readonly<{ step: "SKIPPED"; reason: string }>;

export type RehearsalReport = Readonly<{
  mode: RehearsalMode;
  startedAt: string;
  finishedAt: string;
  steps: readonly RehearsalStep[];
  productionLive: false;
  summary: string;
}>;

export async function runRehearsalCycle(input: RehearsalCycleInput): Promise<RehearsalReport> {
  if (input.mode !== "DRY_RUN" && input.mode !== "SHADOW") {
    throw new Error("rehearsal loop only accepts DRY_RUN or SHADOW; LIVE is forbidden");
  }

  const startedAt = new Date().toISOString();
  const steps: RehearsalStep[] = [];

  const recoveryDecisions = reconcileRecovery(
    input.recoverySnapshots,
    new Date(input.now),
    input.heartbeatGraceMs,
  );
  steps.push({ step: "RECOVERY", decisions: recoveryDecisions });

  const reclaimDecisions = input.recoverySnapshots
    .filter((s) => s.status === "STALE")
    .map((s) => authorizeReclaim(s));
  steps.push({ step: "RECLAIM_GATE", decisions: reclaimDecisions });

  const dispatchDecisions = reconcileSupervisor(input.reconcile);
  steps.push({ step: "RECONCILE", decisions: dispatchDecisions });

  if (input.attempts && input.attempts.length > 0) {
    const fenceDecisions = input.attempts.map((a) =>
      authorizeAttemptCompletion({
        attempt: a.attempt,
        currentLease: a.currentLease,
        intent: a.intent,
        actorId: a.actorId,
        workspaceId: a.workspaceId,
        projectId: a.projectId,
      }),
    );
    steps.push({ step: "ATTEMPT_FENCE", decisions: fenceDecisions });
  }

  const wouldDispatch = dispatchDecisions.some((d) => d.kind === "DISPATCH");
  if (input.mode === "SHADOW" && wouldDispatch && input.shadowExecute) {
    const envelope = await input.shadowExecute();
    steps.push({ step: "SHADOW_PROVIDER", envelope });
  } else if (input.mode === "SHADOW" && wouldDispatch && !input.shadowExecute) {
    steps.push({
      step: "SKIPPED",
      reason: "SHADOW mode but no shadowExecute injected; provider not called",
    });
  } else {
    steps.push({
      step: "SKIPPED",
      reason: wouldDispatch
        ? "DRY_RUN: dispatch decision recorded; provider not invoked; no durable writes"
        : "no DISPATCH decision; nothing to execute",
    });
  }

  const finishedAt = new Date().toISOString();
  const dispatchCount = dispatchDecisions.filter((d) => d.kind === "DISPATCH").length;
  const holdCount = dispatchDecisions.filter((d) => d.kind === "HOLD").length;
  const staleCount = recoveryDecisions.filter((d) => d.kind === "MARK_STALE").length;
  const fenceReject =
    steps.find((s) => s.step === "ATTEMPT_FENCE")?.step === "ATTEMPT_FENCE"
      ? (steps.find((s) => s.step === "ATTEMPT_FENCE") as Extract<RehearsalStep, { step: "ATTEMPT_FENCE" }>)
          .decisions.filter((d) => !d.allowed).length
      : 0;

  return {
    mode: input.mode,
    startedAt,
    finishedAt,
    steps,
    productionLive: false,
    summary: `rehearsal ${input.mode}: ${dispatchCount} dispatch, ${holdCount} hold, ${staleCount} mark-stale, ${fenceReject} fence-reject; productionLive=false`,
  };
}
