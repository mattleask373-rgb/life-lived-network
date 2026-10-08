import { describe, expect, it } from "vitest";

import {
  reconcileCrashSafe,
  type CrashSafeInput,
  type LeaseSnapshot,
} from "./agent-crash-safe-reconcile";

const baseLease = (overrides: Partial<LeaseSnapshot> = {}): LeaseSnapshot => ({
  taskId: "task-1",
  attemptId: "attempt-1",
  runId: "run-1",
  actorId: "actor-1",
  workspaceId: "ws-1",
  projectId: "project-1",
  leaseGeneration: 3,
  leaseToken: "tok-abc",
  leaseExpiry: "2026-10-08T01:00:00.000Z",
  attemptStatus: "RUNNING",
  lastHeartbeatAt: "2026-10-08T00:30:00.000Z",
  correlationId: "dispatch:run-1:task-1",
  ...overrides,
});

const policy = {
  staleLeaseMs: 5 * 60 * 1000, // 5 min
  orphanedAttemptMs: 10 * 60 * 1000, // 10 min
  allowedWorkspaces: ["ws-1"],
  allowedProjects: ["project-1"],
  allowedAutonomy: ["L0", "L1", "L2"] as const,
  humanGatedRisks: ["P0", "P1"] as const,
};

const input = (leases: LeaseSnapshot[], now = "2026-10-08T00:45:00.000Z"): CrashSafeInput => ({
  now,
  runId: "run-1",
  actorId: "actor-1",
  leases,
  policy,
});

describe("phase-4 crash-safe reconciliation", () => {
  it("holds a healthy in-window lease", () => {
    const [d] = reconcileCrashSafe(input([baseLease()]));
    expect(d.kind).toBe("HOLD");
    expect(d.reason).toContain("still valid");
  });

  it("releases an expired lease and marks the attempt abandoned", () => {
    const decisions = reconcileCrashSafe(
      input([baseLease({ leaseExpiry: "2026-10-08T00:10:00.000Z" })], "2026-10-08T00:45:00.000Z"),
    );
    expect(decisions.map((d) => d.kind)).toEqual([
      "RELEASE_STALE_LEASE",
      "MARK_ATTEMPT_ABANDONED",
      "RECOVER_READY",
    ]);
    const release = decisions[0];
    if (release.kind === "RELEASE_STALE_LEASE") {
      expect(release.leaseGeneration).toBe(3);
      expect(release.leaseToken).toBe("tok-abc");
    }
  });

  it("releases a heartbeat-stale lease even if expiry is in the future", () => {
    const decisions = reconcileCrashSafe(
      input(
        [
          baseLease({
            leaseExpiry: "2026-10-08T02:00:00.000Z",
            lastHeartbeatAt: "2026-10-08T00:00:00.000Z", // 45 min ago > 5 min
          }),
        ],
        "2026-10-08T00:45:00.000Z",
      ),
    );
    expect(decisions.some((d) => d.kind === "RELEASE_STALE_LEASE")).toBe(true);
    expect(decisions.some((d) => d.kind === "RECOVER_READY")).toBe(true);
  });

  it("abandons an orphaned DISPATCHED attempt and recovers the task", () => {
    const decisions = reconcileCrashSafe(
      input(
        [
          baseLease({
            attemptStatus: "DISPATCHED",
            lastHeartbeatAt: "2026-10-08T00:00:00.000Z", // 45 min > 10 min orphan threshold
            leaseExpiry: "2026-10-08T02:00:00.000Z",
          }),
        ],
        "2026-10-08T00:45:00.000Z",
      ),
    );
    expect(decisions.map((d) => d.kind)).toContain("MARK_ATTEMPT_ABANDONED");
    expect(decisions.map((d) => d.kind)).toContain("RELEASE_STALE_LEASE");
    expect(decisions.map((d) => d.kind)).toContain("RECOVER_READY");
  });

  it("refuses cross-run recovery", () => {
    const [d] = reconcileCrashSafe(
      input([baseLease({ runId: "run-other" })]),
    );
    expect(d.kind).toBe("HOLD");
    expect(d.reason).toContain("different run");
  });

  it("refuses out-of-scope workspace/project", () => {
    const ws = reconcileCrashSafe(input([baseLease({ workspaceId: "ws-2" })]))[0];
    const proj = reconcileCrashSafe(input([baseLease({ projectId: "project-2" })]))[0];
    expect(ws.reason).toContain("workspace");
    expect(proj.reason).toContain("project");
  });

  it("does not mutate input leases", () => {
    const leases = [baseLease()];
    reconcileCrashSafe(input(leases));
    expect(leases).toHaveLength(1);
    expect(leases[0].leaseGeneration).toBe(3);
  });

  it("handles lease with no attempt cleanly", () => {
    const decisions = reconcileCrashSafe(
      input(
        [
          baseLease({
            attemptId: null,
            attemptStatus: null,
            lastHeartbeatAt: null,
            leaseExpiry: "2026-10-08T00:10:00.000Z",
          }),
        ],
        "2026-10-08T00:45:00.000Z",
      ),
    );
    expect(decisions.some((d) => d.kind === "RELEASE_STALE_LEASE")).toBe(true);
    expect(decisions.some((d) => d.kind === "RECOVER_READY")).toBe(true);
    expect(decisions.some((d) => d.kind === "MARK_ATTEMPT_ABANDONED")).toBe(false);
  });
});
