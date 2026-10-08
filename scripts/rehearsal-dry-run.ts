/**
 * Runnable non-production rehearsal entry.
 *
 * Usage (from repo root, after deps install):
 *   bun run scripts/rehearsal-dry-run.ts
 *
 * Always DRY_RUN. Never claims leases, never writes production, never LIVE.
 */

import { runRehearsalCycle } from "../src/lib/agent-rehearsal-loop";
import type { SupervisorTaskSnapshot } from "../src/lib/agent-supervisor-reconcile";
import type { RecoveryTaskSnapshot } from "../src/lib/agent-supervisor-recovery";

const now = new Date().toISOString();

const readyTask: SupervisorTaskSnapshot = {
  task: {
    task_id: "rehearsal-task-1",
    source: {
      system: "rehearsal",
      workspace_id: "ws-rehearsal",
      work_item_id: "work-1",
      event_id: "event-1",
    },
    objective: "Non-prod rehearsal only — no production mutation",
    lane: "IMPLEMENTATION",
    autonomy: "L2",
    risk: "P3",
    scope_in: ["src/lib/agent-rehearsal-loop.ts"],
    scope_out: ["main", "production", ".env"],
    dependencies: [],
    acceptance_criteria: ["Emit RehearsalReport with productionLive=false"],
    invariants: ["No autonomous merge", "No LIVE mode"],
    provider: "auto",
  },
  status: "READY",
  workspaceId: "ws-rehearsal",
  projectId: "project-rehearsal",
  leaseGeneration: null,
  leaseToken: null,
  leaseExpiry: null,
  activeAttemptId: null,
};

const claimedRecovery: RecoveryTaskSnapshot = {
  taskId: "rehearsal-task-stale",
  status: "CLAIMED",
  lease: {
    taskId: "rehearsal-task-stale",
    status: "CLAIMED",
    owner: "actor-rehearsal",
    leaseExpiry: new Date(Date.now() - 60_000),
    lastHeartbeat: new Date(Date.now() - 3_600_000),
    leaseGeneration: 1,
    leaseToken: "tok-old",
  },
  activeAttemptId: "attempt-old",
  activeAttemptStatus: "RUNNING",
  workspaceId: "ws-rehearsal",
  projectId: "project-rehearsal",
};

async function main() {
  const report = await runRehearsalCycle({
    mode: "DRY_RUN",
    now,
    heartbeatGraceMs: 45 * 60 * 1000,
    recoverySnapshots: [claimedRecovery],
    reconcile: {
      now,
      runId: `rehearsal-run-${Date.now()}`,
      actorId: "actor-rehearsal",
      snapshots: [readyTask],
      existingCorrelationIds: new Set(),
      policy: {
        allowedAutonomy: ["L0", "L1", "L2"],
        humanGatedRisks: ["P0", "P1"],
        allowedWorkspaces: ["ws-rehearsal"],
        allowedProjects: ["project-rehearsal"],
      },
    },
    attempts: [
      {
        // Stale gen attempt — must be rejected by fence
        attempt: {
          attemptId: "attempt-old",
          taskId: "rehearsal-task-stale",
          runId: "run-old",
          workspaceId: "ws-rehearsal",
          projectId: "project-rehearsal",
          leaseGeneration: 1,
          leaseToken: "tok-old",
          status: "RUNNING",
          correlationId: "dispatch:run-old:rehearsal-task-stale",
          actorId: "actor-rehearsal",
        },
        currentLease: {
          taskId: "rehearsal-task-stale",
          status: "IN_PROGRESS",
          owner: "actor-new",
          leaseExpiry: new Date(Date.now() + 3_600_000),
          lastHeartbeat: new Date(),
          leaseGeneration: 2,
          leaseToken: "tok-new",
        },
        intent: "VERIFYING",
        actorId: "actor-rehearsal",
        workspaceId: "ws-rehearsal",
        projectId: "project-rehearsal",
      },
    ],
  });

  console.log(JSON.stringify(report, null, 2));

  if (report.productionLive !== false) {
    console.error("FATAL: productionLive must be false");
    process.exit(1);
  }

  console.error("\n[rehearsal] OK — productionLive=false; no durable writes; LIVE not activated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
