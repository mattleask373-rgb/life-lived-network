import { describe, expect, it } from "vitest";
import { authorizeReclaim, reconcileRecovery } from "./agent-supervisor-recovery";

const base = {
  taskId: "task-1",
  status: "CLAIMED" as const,
  lease: {
    taskId: "task-1",
    status: "CLAIMED" as const,
    owner: "actor-1",
    leaseExpiry: new Date("2026-10-08T10:00:00Z"),
    lastHeartbeat: new Date("2026-10-08T09:00:00Z"),
    leaseGeneration: 3,
    leaseToken: "token-3",
  },
  activeAttemptId: "attempt-1",
  activeAttemptStatus: "RUNNING" as const,
  workspaceId: "workspace-1",
  projectId: "project-1",
};

describe("agent supervisor recovery", () => {
  it("marks an expired, grace-exceeded lease stale", () => {
    const decisions = reconcileRecovery(
      [base],
      new Date("2026-10-08T10:00:01Z"),
      45 * 60 * 1000,
    );
    expect(decisions[0]).toEqual({
      kind: "MARK_STALE",
      taskId: "task-1",
      reason: "lease expired and heartbeat grace exceeded",
    });
  });

  it("holds a lease that is still inside heartbeat grace", () => {
    const decisions = reconcileRecovery(
      [base],
      new Date("2026-10-08T09:30:00Z"),
      45 * 60 * 1000,
    );
    expect(decisions[0].kind).toBe("HOLD");
  });

  it("never resurrects cancelled work", () => {
    const decisions = reconcileRecovery(
      [{ ...base, status: "CANCELLED" }],
      new Date("2026-10-08T12:00:00Z"),
      0,
    );
    expect(decisions[0].reason).toContain("cannot be resurrected");
  });

  it("does not reclaim directly from stale; stale must be reconciled first", () => {
    const decision = authorizeReclaim({
      taskId: "task-1",
      status: "CLAIMED",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });
    expect(decision.kind).toBe("HOLD");
  });

  it("permits a fresh reclaim only after ownership is cleared", () => {
    const decision = authorizeReclaim({
      taskId: "task-1",
      status: "READY",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });
    expect(decision.kind).toBe("RECLAIM");
  });
});
