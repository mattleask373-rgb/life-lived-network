import type { AgentTaskEnvelope, AutonomyLevel, RiskLevel } from "./agent-orchestration";

export type ReconcileTaskStatus = "READY" | "CLAIMED" | "VERIFYING" | "BLOCKED" | "CANCELLED" | "DONE";

export type SupervisorTaskSnapshot = Readonly<{
  task: AgentTaskEnvelope;
  status: ReconcileTaskStatus;
  workspaceId: string;
  projectId: string | null;
  leaseGeneration: number | null;
  leaseToken: string | null;
  leaseExpiry: string | null;
  activeAttemptId: string | null;
}>;

export type SupervisorPolicy = Readonly<{
  allowedAutonomy: readonly AutonomyLevel[];
  humanGatedRisks: readonly RiskLevel[];
  allowedWorkspaces: readonly string[];
  allowedProjects: readonly string[];
}>;

export type DispatchDecision =
  | Readonly<{
      kind: "DISPATCH";
      taskId: string;
      workspaceId: string;
      projectId: string;
      correlationId: string;
      reason: string;
    }>
  | Readonly<{
      kind: "HOLD";
      taskId: string;
      reason: string;
    }>;

export type ReconcileInput = Readonly<{
  now: string;
  runId: string;
  actorId: string;
  snapshots: readonly SupervisorTaskSnapshot[];
  existingCorrelationIds: ReadonlySet<string>;
  policy: SupervisorPolicy;
}>;

function stableCorrelation(runId: string, taskId: string): string {
  return `dispatch:${runId}:${taskId}`;
}

function hold(taskId: string, reason: string): DispatchDecision {
  return { kind: "HOLD", taskId, reason };
}

/**
 * Pure supervisor selection/reconciliation.
 *
 * This function does not claim a task, call a provider, mutate a database,
 * consume human approval, merge, deploy, or infer missing external facts.
 * It converts durable task snapshots into an explicit dispatch decision.
 */
export function reconcileSupervisor(input: ReconcileInput): readonly DispatchDecision[] {
  const seenTasks = new Set<string>();
  const decisions: DispatchDecision[] = [];

  for (const snapshot of input.snapshots) {
    const taskId = snapshot.task.task_id;

    if (seenTasks.has(taskId)) {
      decisions.push(hold(taskId, "duplicate task snapshot in reconciliation input"));
      continue;
    }
    seenTasks.add(taskId);

    if (snapshot.status !== "READY") {
      decisions.push(hold(taskId, `task status ${snapshot.status} is not dispatchable`));
      continue;
    }

    if (!snapshot.projectId?.trim()) {
      decisions.push(hold(taskId, "project scope is required before dispatch"));
      continue;
    }

    if (!input.policy.allowedWorkspaces.includes(snapshot.workspaceId)) {
      decisions.push(hold(taskId, "workspace is outside supervisor scope"));
      continue;
    }

    if (!input.policy.allowedProjects.includes(snapshot.projectId)) {
      decisions.push(hold(taskId, "project is outside supervisor scope"));
      continue;
    }

    if (!input.policy.allowedAutonomy.includes(snapshot.task.autonomy)) {
      decisions.push(hold(taskId, `autonomy ${snapshot.task.autonomy} is outside supervisor policy`));
      continue;
    }

    if (input.policy.humanGatedRisks.includes(snapshot.task.risk)) {
      decisions.push(hold(taskId, `risk ${snapshot.task.risk} requires human gate`));
      continue;
    }

    if (snapshot.activeAttemptId) {
      decisions.push(hold(taskId, "task already has an active attempt"));
      continue;
    }

    if (snapshot.leaseGeneration !== null || snapshot.leaseToken !== null || snapshot.leaseExpiry !== null) {
      decisions.push(hold(taskId, "task carries lease state and must be reconciled through the lease boundary"));
      continue;
    }

    const correlationId = stableCorrelation(input.runId, taskId);
    if (input.existingCorrelationIds.has(correlationId)) {
      decisions.push(hold(taskId, "dispatch correlation already exists; preserve idempotency"));
      continue;
    }

    decisions.push({
      kind: "DISPATCH",
      taskId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      correlationId,
      reason: "READY task passed bounded scope, autonomy, risk, lease and idempotency checks",
    });
  }

  return decisions;
}
