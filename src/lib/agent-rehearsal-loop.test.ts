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

describe("phase-8 non-production rehearsal loop", () => {
  it("runs a dry-run cycle without going live", async () => {
    const report = await runRehearsalCycle(baseInput);
    expect(report.productionLive).toBe(false);
    expect(report.mode).toBe("DRY_RUN");
    expect(report.summary).toContain("productionLive=false");
    expect(report.steps.some((s) => s.step === "RECONCILE")).toBe(true);
    expect(report.steps.some((s) => s.step === "RECOVERY")).toBe(true);
  });

  it("records DISPATCH decisions without invoking a provider in DRY_RUN", async () => {
    const report = await runRehearsalCycle(baseInput);
    const reconcile = report.steps.find((s) => s.step === "RECONCILE");
    expect(reconcile?.step).toBe("RECONCILE");
    if (reconcile?.step === "RECONCILE") {
      expect(reconcile.decisions.some((d) => d.kind === "DISPATCH")).toBe(true);
    }
    expect(report.steps.some((s) => s.step === "SHADOW_PROVIDER")).toBe(false);
    expect(report.steps.some((s) => s.step === "SKIPPED")).toBe(true);
  });

  it("marks stale recovery without mutating durable state", async () => {
    const report = await runRehearsalCycle(baseInput);
    const recovery = report.steps.find((s) => s.step === "RECOVERY");
    if (recovery?.step === "RECOVERY") {
      expect(recovery.decisions.some((d) => d.kind === "MARK_STALE")).toBe(true);
    }
  });

  it("rejects LIVE mode", async () => {
    await expect(
      runRehearsalCycle({ ...baseInput, mode: "LIVE" as never }),
    ).rejects.toThrow(/LIVE is forbidden/);
  });

  it("shadow mode can invoke an injected provider without flipping productionLive", async () => {
    const report = await runRehearsalCycle({
      ...baseInput,
      mode: "SHADOW",
      shadowExecute: async () => ({
        result: {
          taskId: "task-1",
          status: "VERIFYING",
          summary: "shadow evidence only",
          changedPaths: [],
          testsRun: [],
          testsPassed: 0,
          testsFailed: 0,
          claims: [],
          uncertainties: [],
          blockers: [],
          handoff: "shadow",
          recommendedNextAction: "review",
          provider: { id: "shadow" },
        },
        providerId: "shadow",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      }),
    });
    expect(report.productionLive).toBe(false);
    expect(report.steps.some((s) => s.step === "SHADOW_PROVIDER")).toBe(true);
  });
});
