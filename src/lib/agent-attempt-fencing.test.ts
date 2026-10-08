import { describe, expect, it } from "vitest";
import {
  authorizeAttemptCompletion,
  isStaleGenerationAttempt,
  type AttemptRecord,
} from "./agent-attempt-fencing";
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

const baseReq = (overrides: Record<string, unknown> = {}) => ({
  attempt: attempt(),
  currentLease: lease(),
  intent: "VERIFYING" as const,
  actorId: "actor-1",
  workspaceId: "ws-1",
  projectId: "project-1",
  ...overrides,
});

describe("attempt-level completion fencing", () => {
  it("allows completion when generation and token match", () => {
    const d = authorizeAttemptCompletion(baseReq());
    expect(d.allowed).toBe(true);
  });

  it("rejects stale generation after reclaim (gen N vs N+1)", () => {
    const d = authorizeAttemptCompletion(
      baseReq({
        attempt: attempt({ leaseGeneration: 3, leaseToken: "tok-3" }),
        currentLease: lease({ leaseGeneration: 4, leaseToken: "tok-4" }),
      }),
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) {
      expect(d.code).toBe("GENERATION_MISMATCH");
      expect(d.reason).toContain("stale attempt generation");
    }
  });

  it("rejects wrong token even if generation matches", () => {
    const d = authorizeAttemptCompletion(
      baseReq({
        attempt: attempt({ leaseToken: "old-token" }),
        currentLease: lease({ leaseToken: "tok-3" }),
      }),
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) {
      expect(d.code).toBe("TOKEN_MISMATCH");
    }
  });

  it("rejects cancelled attempts", () => {
    const d = authorizeAttemptCompletion(
      baseReq({ attempt: attempt({ status: "CANCELLED" }) }),
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("ATTEMPT_CANCELLED");
  });

  it("rejects already-terminal FAILED attempts", () => {
    const d = authorizeAttemptCompletion(
      baseReq({ attempt: attempt({ status: "FAILED" }) }),
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("ATTEMPT_ALREADY_TERMINAL");
  });

  it("rejects actor mismatch", () => {
    const d = authorizeAttemptCompletion(baseReq({ actorId: "other-actor" }));
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("ACTOR_MISMATCH");
  });

  it("rejects cross-project scope", () => {
    const d = authorizeAttemptCompletion(baseReq({ projectId: "project-2" }));
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("SCOPE_MISMATCH");
  });

  it("rejects cross-workspace scope", () => {
    const d = authorizeAttemptCompletion(baseReq({ workspaceId: "ws-2" }));
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("SCOPE_MISMATCH");
  });

  it("isStaleGenerationAttempt detects gen drift", () => {
    expect(isStaleGenerationAttempt({ leaseGeneration: 3 }, 4)).toBe(true);
    expect(isStaleGenerationAttempt({ leaseGeneration: 4 }, 4)).toBe(false);
  });

  it("does not allow a reclaimed-over attempt to report VERIFYING", () => {
    // Classic race: worker A still running after reclaim created attempt B
    const d = authorizeAttemptCompletion(
      baseReq({
        attempt: attempt({
          attemptId: "attempt-a",
          leaseGeneration: 3,
          leaseToken: "tok-3",
          status: "RUNNING",
        }),
        currentLease: lease({
          leaseGeneration: 4,
          leaseToken: "tok-4",
          owner: "actor-2",
        }),
        actorId: "actor-1",
      }),
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("GENERATION_MISMATCH");
  });
});
