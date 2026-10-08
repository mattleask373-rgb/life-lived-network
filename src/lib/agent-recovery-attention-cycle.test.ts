import { describe, expect, it } from "vitest";
import { planRecoveryAttentionCycle } from "./agent-recovery-attention-cycle";
import type { RecoveryTaskSnapshot } from "./agent-supervisor-recovery";

const staleSnapshot: RecoveryTaskSnapshot = {
  taskId: "task-stale",
  status: "STALE",
  lease: {
    taskId: "task-stale",
    status: "STALE",
    owner: null,
    leaseExpiry: new Date("2026-10-08T08:00:00Z"),
    lastHeartbeat: new Date("2026-10-08T07:00:00Z"),
    leaseGeneration: 2,
    leaseToken: "tok-old",
  },
  activeAttemptId: "attempt-old",
  activeAttemptStatus: "RUNNING",
  workspaceId: "ws-1",
  projectId: "project-1",
};

describe("recovery attention cycle", () => {
  it("plans reclaim and abandon for STALE task with prior-gen attempt", () => {
    const plan = planRecoveryAttentionCycle({
      now: new Date("2026-10-08T10:00:00Z"),
      heartbeatGraceMs: 45 * 60 * 1000,
      snapshots: [staleSnapshot],
      attemptsByTaskId: new Map([
        [
          "task-stale",
          [
            {
              attemptId: "attempt-old",
              taskId: "task-stale",
              leaseGeneration: 2,
              status: "RUNNING",
            },
          ],
        ],
      ]),
    });

    expect(plan.reclaimDecisions.some((d) => d.kind === "RECLAIM")).toBe(true);
    expect(plan.abandonPlans[0]?.decisions.some((d) => d.kind === "ABANDON")).toBe(true);
    expect(plan.attention.length).toBeGreaterThan(0);
    expect(plan.summary).toContain("productionLive=false");
  });

  it("does not reclaim non-STALE claimed work", () => {
    const claimed: RecoveryTaskSnapshot = {
      ...staleSnapshot,
      taskId: "task-claimed",
      status: "CLAIMED",
      lease: {
        ...staleSnapshot.lease!,
        taskId: "task-claimed",
        status: "CLAIMED",
        owner: "actor-1",
        leaseExpiry: new Date("2026-10-08T12:00:00Z"),
        lastHeartbeat: new Date("2026-10-08T11:00:00Z"),
      },
    };
    const plan = planRecoveryAttentionCycle({
      now: new Date("2026-10-08T11:05:00Z"),
      heartbeatGraceMs: 45 * 60 * 1000,
      snapshots: [claimed],
    });
    expect(plan.reclaimDecisions).toHaveLength(0);
  });
});
