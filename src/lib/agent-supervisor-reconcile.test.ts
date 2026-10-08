import { describe, expect, it } from "vitest";
import { reconcileSupervisor, type SupervisorTaskSnapshot } from "./agent-supervisor-reconcile";

const base: SupervisorTaskSnapshot = {
  task: {
    task_id: "task-1",
    source: { system: "plane", workspace_id: "ws-1", work_item_id: "work-1", event_id: "event-1" },
    objective: "Bounded implementation",
    lane: "IMPLEMENTATION",
    autonomy: "L2",
    risk: "P3",
    scope_in: ["src/lib/example.ts"],
    scope_out: ["main", "production"],
    dependencies: [],
    acceptance_criteria: ["Produce evidence"],
    invariants: ["No autonomous merge to main"],
    provider: "auto",
  },
  status: "READY",
  workspaceId: "ws-1",
  projectId: "project-1",
  leaseGeneration: null,
  leaseToken: null,
  leaseExpiry: null,
  activeAttemptId: null,
};

const input = (snapshot: SupervisorTaskSnapshot = base) => ({
  now: "2026-10-08T00:00:00.000Z",
  runId: "run-1",
  actorId: "actor-1",
  snapshots: [snapshot],
  existingCorrelationIds: new Set<string>(),
  policy: {
    allowedAutonomy: ["L0", "L1", "L2"] as const,
    humanGatedRisks: ["P0", "P1"] as const,
    allowedWorkspaces: ["ws-1"],
    allowedProjects: ["project-1"],
  },
});

describe("phase-3 supervisor reconciliation", () => {
  it("dispatches only a fully scoped READY task", () => {
    const [decision] = reconcileSupervisor(input());
    expect(decision).toEqual({
      kind: "DISPATCH",
      taskId: "task-1",
      workspaceId: "ws-1",
      projectId: "project-1",
      correlationId: "dispatch:run-1:task-1",
      reason: "READY task passed bounded scope, autonomy, risk, lease and idempotency checks",
    });
  });

  it("holds a task when project scope is missing", () => {
    const [decision] = reconcileSupervisor(input({ ...base, projectId: null }));
    expect(decision.kind).toBe("HOLD");
    expect(decision.reason).toContain("project scope");
  });

  it("holds cross-workspace and cross-project tasks", () => {
    const workspace = reconcileSupervisor(input({ ...base, workspaceId: "ws-2" }))[0];
    const project = reconcileSupervisor(input({ ...base, projectId: "project-2" }))[0];
    expect(workspace.reason).toContain("workspace");
    expect(project.reason).toContain("project");
  });

  it("holds human-gated risk instead of dispatching", () => {
    const decision = reconcileSupervisor(input({
      ...base,
      task: { ...base.task, risk: "P1" },
    }))[0];
    expect(decision.kind).toBe("HOLD");
    expect(decision.reason).toContain("human gate");
  });

  it("holds an existing active attempt", () => {
    const decision = reconcileSupervisor(input({ ...base, activeAttemptId: "attempt-1" }))[0];
    expect(decision.reason).toContain("active attempt");
  });

  it("holds duplicate correlation rather than double-dispatching", () => {
    const state = input();
    state.existingCorrelationIds.add("dispatch:run-1:task-1");
    const [decision] = reconcileSupervisor(state);
    expect(decision.kind).toBe("HOLD");
    expect(decision.reason).toContain("idempotency");
  });

  it("holds stale lease state for the durable lease boundary", () => {
    const decision = reconcileSupervisor(input({ ...base, leaseGeneration: 2, leaseToken: "token" }))[0];
    expect(decision.kind).toBe("HOLD");
    expect(decision.reason).toContain("lease boundary");
  });

  it("does not mutate the input snapshots", () => {
    const snapshots = [base];
    reconcileSupervisor({ ...input(), snapshots });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toBe(base);
  });
});
