import { describe, expect, it } from "vitest";
import { runRehearsalCycle } from "./agent-rehearsal-loop";
import type { SupervisorTaskSnapshot } from "./agent-supervisor-reconcile";
import type { RecoveryTaskSnapshot } from "./agent-supervisor-recovery";

const readySnapshot: SupervisorTaskSnapshot = {
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

const claimedRecovery: RecoveryTaskSnapshot = {
  taskId: "task-2",
  status: "CLAIMED",
  lease: {
    taskId: "task-2",
    status: "CLAIMED",
    owner: "actor-1",
    leaseExpiry: new Date("2026-10-08T10:00:00Z"),
    lastHeartbeat: new Date("2026-10-08T09:00:00Z"),
    leaseGeneration: 2,
    leaseToken: "tok",
  },
  activeAttemptId: "attempt-2",
  activeAttemptStatus: "RUNNING",
  workspaceId: "ws-1",
  projectId: "project-1",
};

const baseInput = {
  mode: "DRY_RUN" as const,
  now: "2026-10-08T10:00:01.000Z",
  heartbeatGraceMs: 45 * 60 * 1000,
  recoverySnapshots: [claimedRecovery],
  reconcile: {
    now: "2026-10-08T10:00:01.000Z",
    runId: "run-1",
    actorId: "actor-1",
    snapshots: [readySnapshot],
    existingCorrelationIds: new Set<string>(),
    policy: {
      allowedAutonomy: ["L0", "L1", "L2"] as const,
      humanGatedRisks: ["P0", "P1"] as const,
      allowedWorkspaces: ["ws-1"],
      allowedProjects: ["project-1"],
    },
  },
};

describe("ready-to-run non-prod rehearsal", () => {
  it("always reports productionLive=false", async () => {
    const report = await runRehearsalCycle(baseInput);
    expect(report.productionLive).toBe(false);
    expect(report.summary).toContain("productionLive=false");
  });

  it("rejects LIVE mode", async () => {
    await expect(
      runRehearsalCycle({ ...baseInput, mode: "LIVE" as never }),
    ).rejects.toThrow(/LIVE is forbidden/);
  });

  it("exercises attempt fence reject on stale generation", async () => {
    const report = await runRehearsalCycle({
      ...baseInput,
      attempts: [
        {
          attempt: {
            attemptId: "a1",
            taskId: "task-2",
            runId: "run-old",
            workspaceId: "ws-1",
            projectId: "project-1",
            leaseGeneration: 2,
            leaseToken: "tok",
            status: "RUNNING",
            correlationId: "c1",
            actorId: "actor-1",
          },
          currentLease: {
            taskId: "task-2",
            status: "IN_PROGRESS",
            owner: "actor-2",
            leaseExpiry: new Date("2026-10-08T12:00:00Z"),
            lastHeartbeat: new Date("2026-10-08T11:00:00Z"),
            leaseGeneration: 3,
            leaseToken: "tok-new",
          },
          intent: "VERIFYING",
          actorId: "actor-1",
          workspaceId: "ws-1",
          projectId: "project-1",
        },
      ],
    });
    const fence = report.steps.find((s) => s.step === "ATTEMPT_FENCE");
    expect(fence?.step).toBe("ATTEMPT_FENCE");
    if (fence?.step === "ATTEMPT_FENCE") {
      expect(fence.decisions.some((d) => !d.allowed)).toBe(true);
    }
    expect(report.summary).toMatch(/fence-reject/);
  });
});
