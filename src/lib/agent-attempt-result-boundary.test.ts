import { describe, expect, it } from "vitest";
import { authorizeAttemptCompletion, type AttemptRecord } from "./agent-attempt-fencing";
import type { LeaseSnapshot } from "./agent-lease-policy";

const attempt = (overrides: Partial<AttemptRecord> = {}): AttemptRecord => ({
  attemptId: "attempt-a",
  taskId: "task-1",
  runId: "run-1",
  workspaceId: "ws-1",
  projectId: "project-1",
  leaseGeneration: 3,
  leaseToken: "tok-3",
  status: "RUNNING",
  correlationId: "dispatch:run-1:task-1",
  actorId: "actor-1",
  ...overrides,
});

const lease = (overrides: Partial<LeaseSnapshot> = {}): LeaseSnapshot => ({
  taskId: "task-1",
  status: "IN_PROGRESS",
  owner: "actor-1",
  leaseExpiry: new Date("2026-10-08T12:00:00Z"),
  lastHeartbeat: new Date("2026-10-08T11:00:00Z"),
  leaseGeneration: 3,
  leaseToken: "tok-3",
  ...overrides,
});

describe("durable attempt result boundary contract", () => {
  it("allows only provider-safe VERIFYING/FAILED intents through the pure fence", () => {
    for (const intent of ["VERIFYING", "FAILED"] as const) {
      const decision = authorizeAttemptCompletion({
        attempt: attempt(),
        currentLease: lease(),
        intent,
        actorId: "actor-1",
        workspaceId: "ws-1",
        projectId: "project-1",
      });
      expect(decision.allowed).toBe(true);
    }
  });

  it("rejects the classic stale-worker race before the durable RPC", () => {
    const decision = authorizeAttemptCompletion({
      attempt: attempt({ leaseGeneration: 3, leaseToken: "tok-3" }),
      currentLease: lease({ leaseGeneration: 4, leaseToken: "tok-4", owner: "actor-2" }),
      intent: "VERIFYING",
      actorId: "actor-1",
      workspaceId: "ws-1",
      projectId: "project-1",
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("GENERATION_MISMATCH");
  });

  it("rejects completion after the attempt has become terminal", () => {
    const decision = authorizeAttemptCompletion({
      attempt: attempt({ status: "FAILED" }),
      currentLease: lease(),
      intent: "VERIFYING",
      actorId: "actor-1",
      workspaceId: "ws-1",
      projectId: "project-1",
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("ATTEMPT_ALREADY_TERMINAL");
  });

  it("keeps acceptance outside the attempt result boundary", () => {
    const unsafe = "ACCEPTED" as never;
    const decision = authorizeAttemptCompletion({
      attempt: attempt(),
      currentLease: lease(),
      intent: unsafe,
      actorId: "actor-1",
      workspaceId: "ws-1",
      projectId: "project-1",
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("FORBIDDEN_INTENT");
  });
});
