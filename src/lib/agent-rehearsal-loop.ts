/**
 * Phase 8 — Non-production 24/7 rehearsal loop
 *
 * Dry-run cycle that exercises the control-plane decision surface without
 * ever becoming a live executor.
 *
 * Explicit non-goals (enforced):
 * - Does not claim or renew leases in durable storage
 * - Does not call real providers
 * - Does not write production rows
 * - Does not merge, deploy, or mint credentials
 * - Does not promote any attempt to DONE / ACCEPTED / INTEGRATED
 * - Does not consume human approvals
 * - Does not weaken RLS or human gates
 *
 * Output is always a RehearsalReport: evidence of what *would* happen.
 */

import { reconcileSupervisor, type ReconcileInput, type DispatchDecision } from "./agent-supervisor-reconcile";
import { reconcileRecovery, authorizeReclaim, type RecoveryTaskSnapshot, type RecoveryDecision } from "./agent-supervisor-recovery";
import type { ProviderExecutionEnvelope } from "./agent-provider-runtime";

export type RehearsalMode = "DRY_RUN" | "SHADOW"; // never "LIVE"

export type RehearsalCycleInput = Readonly<{
  mode: RehearsalMode;
  now: string;
  reconcile: ReconcileInput;
  recoverySnapshots: readonly RecoveryTaskSnapshot[];
  heartbeatGraceMs: number;
  /** Injected provider execute for shadow mode only; dry-run never calls it. */
  shadowExecute?: () => Promise<ProviderExecutionEnvelope>;
}>;

export type RehearsalStep =
  | Readonly<{ step: "RECONCILE"; decisions: readonly DispatchDecision[] }>
  | Readonly<{ step: "RECOVERY"; decisions: readonly RecoveryDecision[] }>
  | Readonly<{ step: "RECLAIM_GATE"; decisions: readonly RecoveryDecision[] }>
  | Readonly<{ step: "SHADOW_PROVIDER"; envelope: ProviderExecutionEnvelope }>
  | Readonly<{ step: "SKIPPED"; reason: string }>;

export type RehearsalReport = Readonly<{
  mode: RehearsalMode;
  startedAt: string;
  finishedAt: string;
  steps: readonly RehearsalStep[];
  /** Always false in this module — production live flag is never set. */
  productionLive: false;
  summary: string;
}>;

/**
 * One non-production rehearsal cycle.
 *
 * Order: recovery → reclaim gates → supervisor select → optional shadow provider.
 * Every path remains fail-closed and evidence-only.
 */
export async function runRehearsalCycle(input: RehearsalCycleInput): Promise<RehearsalReport> {
  if (input.mode !== "DRY_RUN" && input.mode !== "SHADOW") {
    throw new Error("rehearsal loop only accepts DRY_RUN or SHADOW; LIVE is forbidden");
  }

  const startedAt = new Date().toISOString();
  const steps: RehearsalStep[] = [];

  // 1. Recovery decisions (pure)
  const recoveryDecisions = reconcileRecovery(
    input.recoverySnapshots,
    new Date(input.now),
    input.heartbeatGraceMs,
  );
  steps.push({ step: "RECOVERY", decisions: recoveryDecisions });

  // 2. Reclaim gates for anything already STALE in the recovery snapshots
  const reclaimDecisions = input.recoverySnapshots
    .filter((s) => s.status === "STALE")
    .map((s) => authorizeReclaim(s));
  steps.push({ step: "RECLAIM_GATE", decisions: reclaimDecisions });

  // 3. Supervisor selection (pure)
  const dispatchDecisions = reconcileSupervisor(input.reconcile);
  steps.push({ step: "RECONCILE", decisions: dispatchDecisions });

  // 4. Shadow provider only in SHADOW mode, and only if a DISPATCH exists
  const wouldDispatch = dispatchDecisions.some((d) => d.kind === "DISPATCH");
  if (input.mode === "SHADOW" && wouldDispatch && input.shadowExecute) {
    const envelope = await input.shadowExecute();
    steps.push({ step: "SHADOW_PROVIDER", envelope });
  } else if (input.mode === "SHADOW" && wouldDispatch && !input.shadowExecute) {
    steps.push({ step: "SKIPPED", reason: "SHADOW mode but no shadowExecute injected; provider not called" });
  } else {
    steps.push({
      step: "SKIPPED",
      reason: wouldDispatch
        ? "DRY_RUN: dispatch decision recorded; provider not invoked"
        : "no DISPATCH decision; nothing to execute",
    });
  }

  const finishedAt = new Date().toISOString();
  const dispatchCount = dispatchDecisions.filter((d) => d.kind === "DISPATCH").length;
  const holdCount = dispatchDecisions.filter((d) => d.kind === "HOLD").length;
  const staleCount = recoveryDecisions.filter((d) => d.kind === "MARK_STALE").length;

  return {
    mode: input.mode,
    startedAt,
    finishedAt,
    steps,
    productionLive: false,
    summary: `rehearsal ${input.mode}: ${dispatchCount} dispatch, ${holdCount} hold, ${staleCount} mark-stale; productionLive=false`,
  };
}
