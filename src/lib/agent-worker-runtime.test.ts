import { afterEach, describe, expect, it, vi } from "vitest";

import {
  runAgentWorkerCycle,
  type WorkerActorIdentity,
  type WorkerCycleInput,
  type WorkerLease,
  type WorkerProof,
  type WorkerProvider,
  type WorkerRuntimeAdapters,
  type WorkerTask,
} from "./agent-worker-runtime";

const NOW = new Date();
const CYCLE_ID = "123e4567-e89b-42d3-a456-426614174000";
const TASK_ID = "LW-20261023-001";

function proof(evidenceRef = "https://github.com/example/repo/actions/runs/1"): WorkerProof {
  return { status: "PROVEN", evidenceRef, checkedAt: NOW.toISOString() };
}

function task(overrides: Partial<WorkerTask> = {}): WorkerTask {
  return {
    taskId: TASK_ID,
    objective: "Add a bounded, tested implementation slice",
    workspaceId: "workspace-1",
    projectId: "project-1",
    status: "READY",
    autonomy: "L2",
    risk: "P2",
    lane: "IMPLEMENTATION",
    scopeIn: ["src/lib"],
    scopeOut: ["main", ".github/workflows"],
    acceptanceCriteria: ["Tests exist", "Evidence is durable"],
    humanApprovalRequired: false,
    cancelled: false,
    ...overrides,
  };
}

function lease(request: Parameters<WorkerRuntimeAdapters["dispatchAtomically"]>[0]): WorkerLease {
  return {
    taskId: request.taskId,
    attemptId: "attempt-1",
    runId: request.cycleId,
    correlationId: request.correlationId,
    actorId: request.actorId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    leaseGeneration: 1,
    leaseToken: "lease-token-private-123456789",
    leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

function provider(overrides: Partial<WorkerProvider> = {}): WorkerProvider {
  return {
    id: "openai",
    capabilities: ["implementation", "research", "review", "qa"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    execute: vi.fn(async () => ({
      status: "VERIFYING",
      summary: "Changes prepared and test evidence attached.",
      evidenceRefs: ["https://github.com/example/repo/commit/abc123"],
      changedPaths: ["src/lib/worker.ts"],
      providerReportedTests: "PASS",
      uncertainties: ["CI still needs to run"],
      nextAction: "Run exact-head CI and request independent review.",
    })),
    ...overrides,
  };
}

function adapters(overrides: Partial<WorkerRuntimeAdapters> = {}): WorkerRuntimeAdapters {
  return {
    loadTask: vi.fn(async () => task()),
    resolveAuthoritativeScope: vi.fn(async () => ({
      workspaceId: "workspace-1",
      projectId: "project-1",
    })),
    readDurableControlPlaneProof: vi.fn(async () => proof("https://github.com/example/repo/commit/abc123")),
    readHostedSecurityProof: vi.fn(async () => proof("https://github.com/example/repo/actions/runs/2")),
    readProviderHealth: vi.fn(async () => ({ status: "available", checkedAt: new Date().toISOString() })),
    findActiveAttempt: vi.fn(async () => null),
    dispatchAtomically: vi.fn(async (request) => lease(request)),
    heartbeatFenced: vi.fn(async () => true),
    recordResultFenced: vi.fn(async () => true),
    recordFailureFenced: vi.fn(async () => true),
    ...overrides,
  };
}

function input(overrides: Partial<WorkerCycleInput> = {}): WorkerCycleInput {
  const identity: WorkerActorIdentity = { actorId: "worker:github-oidc:repo-1", source: "WORKLOAD_IDENTITY" };
  return {
    enabled: true,
    cycleId: CYCLE_ID,
    actor: identity,
    environment: { kind: "DISPOSABLE", ...proof("https://github.com/example/repo/actions/runs/3") },
    taskId: TASK_ID,
    provider: provider(),
    excludedProviderIds: [],
    timeoutMs: 3000,
    heartbeatIntervalMs: 250,
    now: NOW,
    adapters: adapters(),
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("bounded agent worker runtime", () => {
  it("does not touch task or provider adapters when the feature flag is off", async () => {
    const db = adapters();
    const result = await runAgentWorkerCycle(input({ enabled: false, adapters: db }));
    expect(result).toMatchObject({ outcome: "DISABLED", code: "WORKER_DISABLED" });
    expect(db.loadTask).not.toHaveBeenCalled();
    expect(db.dispatchAtomically).not.toHaveBeenCalled();
  });

  it("requires a stable UUID cycle id for retry-safe durable run identity", async () => {
    const result = await runAgentWorkerCycle(input({ cycleId: "not-a-uuid" }));
    expect(result).toMatchObject({ outcome: "HELD", code: "INVALID_CYCLE_ID" });
  });

  it("rejects production, staging, unknown, or unproven environments before loading a task", async () => {
    for (const environment of [
      { kind: "PRODUCTION" as const, ...proof() },
      { kind: "STAGING" as const, ...proof() },
      { kind: "UNKNOWN" as const, ...proof() },
      { kind: "DEVELOPMENT" as const, status: "UNKNOWN" as const, checkedAt: NOW.toISOString() },
    ]) {
      const db = adapters();
      const result = await runAgentWorkerCycle(input({ environment, adapters: db }));
      expect(result.outcome).toBe("HELD");
      expect(db.loadTask).not.toHaveBeenCalled();
    }
  });

  it("rejects stale or missing environment evidence", async () => {
    const environment = {
      kind: "DISPOSABLE" as const,
      status: "PROVEN" as const,
      evidenceRef: "https://github.com/example/repo/actions/runs/3",
      checkedAt: "2026-10-23T08:00:00.000Z",
    };
    const result = await runAgentWorkerCycle(input({ environment }));
    expect(result).toMatchObject({ outcome: "HELD", code: "ENVIRONMENT_NOT_PROVEN" });
  });

  it("requires a server-verified actor rather than environment/caller text", async () => {
    for (const source of ["ENVIRONMENT", "UNTRUSTED", "UNKNOWN"] as const) {
      const result = await runAgentWorkerCycle(
        input({ actor: { actorId: "actor-1", source } }),
      );
      expect(result).toMatchObject({ outcome: "HELD", code: "AUTHENTICATION_REQUIRED" });
    }
    const blank = await runAgentWorkerCycle(input({ actor: { actorId: " ", source: "WORKLOAD_IDENTITY" } }));
    expect(blank).toMatchObject({ outcome: "HELD", code: "AUTHENTICATION_REQUIRED" });
  });

  it("fails closed when task read or authoritative scope lookup fails", async () => {
    const readFailure = await runAgentWorkerCycle(input({
      adapters: adapters({ loadTask: vi.fn(async () => { throw new Error("private db detail"); }) }),
    }));
    expect(readFailure).toMatchObject({ outcome: "HELD", code: "TASK_READ_FAILED" });
    expect(readFailure.reason).not.toContain("private db detail");

    const noScope = await runAgentWorkerCycle(input({
      adapters: adapters({ resolveAuthoritativeScope: vi.fn(async () => null) }),
    }));
    expect(noScope).toMatchObject({ outcome: "HELD", code: "SCOPE_AUTHORITY_MISSING" });
  });

  it("rejects task scope that differs from authoritative membership", async () => {
    const result = await runAgentWorkerCycle(input({
      adapters: adapters({
        resolveAuthoritativeScope: vi.fn(async () => ({
          workspaceId: "workspace-2",
          projectId: "project-1",
        })),
      }),
    }));
    expect(result).toMatchObject({ outcome: "HELD", code: "SCOPE_MISMATCH" });
  });

  it("never autonomously dispatches cancelled, non-ready, incomplete, or human-gated tasks", async () => {
    for (const candidate of [
      task({ status: "CANCELLED", cancelled: true }),
      task({ status: "CLAIMED" }),
      task({ scopeIn: [] }),
      task({ humanApprovalRequired: true }),
      task({ risk: "P0" }),
      task({ risk: "P1" }),
      task({ autonomy: "L3" }),
    ]) {
      const db = adapters({ loadTask: vi.fn(async () => candidate) });
      const result = await runAgentWorkerCycle(input({ adapters: db }));
      expect(result.outcome).toBe("HELD");
      expect(db.dispatchAtomically).not.toHaveBeenCalled();
    }
  });

  it("requires fresh durable and hosted security proofs", async () => {
    const missingDurable = await runAgentWorkerCycle(input({
      adapters: adapters({
        readDurableControlPlaneProof: vi.fn(async () => ({ status: "UNKNOWN", checkedAt: NOW.toISOString() })),
      }),
    }));
    expect(missingDurable).toMatchObject({ outcome: "HELD", code: "CONTROL_PLANE_UNPROVEN" });

    const missingHosted = await runAgentWorkerCycle(input({
      adapters: adapters({
        readHostedSecurityProof: vi.fn(async () => proof("")),
      }),
    }));
    expect(missingHosted).toMatchObject({ outcome: "HELD", code: "HOSTED_SECURITY_UNPROVEN" });
  });

  it("holds if provider health is unknown, stale, or unavailable", async () => {
    for (const health of [
      { status: "unknown" as const, checkedAt: new Date().toISOString() },
      { status: "available" as const, checkedAt: "2026-10-23T08:00:00.000Z" },
      { status: "unavailable" as const, checkedAt: new Date().toISOString() },
    ]) {
      const db = adapters({ readProviderHealth: vi.fn(async () => health) });
      const result = await runAgentWorkerCycle(input({ adapters: db }));
      expect(result).toMatchObject({ outcome: "HELD", code: "PROVIDER_UNAVAILABLE" });
      expect(db.dispatchAtomically).not.toHaveBeenCalled();
    }
  });

  it("holds on an existing active attempt, excluded provider, or capability mismatch", async () => {
    const active = await runAgentWorkerCycle(input({
      adapters: adapters({ findActiveAttempt: vi.fn(async () => "attempt-existing") }),
    }));
    expect(active).toMatchObject({ outcome: "HELD", code: "ACTIVE_ATTEMPT_EXISTS" });

    const excluded = await runAgentWorkerCycle(input({ excludedProviderIds: ["openai"] }));
    expect(excluded).toMatchObject({ outcome: "HELD", code: "PROVIDER_NOT_ELIGIBLE" });

    const wrongCapability = await runAgentWorkerCycle(input({
      provider: provider({ capabilities: ["research"] }),
    }));
    expect(wrongCapability).toMatchObject({ outcome: "HELD", code: "PROVIDER_NOT_ELIGIBLE" });
  });

  it("dispatches one scoped attempt and records a non-terminal result under the lease fence", async () => {
    const db = adapters();
    const model = provider();
    const result = await runAgentWorkerCycle(input({ adapters: db, provider: model }));

    expect(result.outcome).toBe("REVIEW_REQUIRED");
    expect(result.attemptId).toBe("attempt-1");
    expect(db.dispatchAtomically).toHaveBeenCalledTimes(1);
    expect(db.dispatchAtomically).toHaveBeenCalledWith(expect.objectContaining({
      cycleId: CYCLE_ID,
      correlationId: CYCLE_ID + ":" + TASK_ID,
      actorId: "worker:github-oidc:repo-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      taskId: TASK_ID,
      providerId: "openai",
    }));
    expect(model.execute).toHaveBeenCalledTimes(1);
    const context = vi.mocked(model.execute).mock.calls[0]?.[1];
    expect(context).toBeDefined();
    expect(context).not.toHaveProperty("leaseToken");
    expect(db.recordResultFenced).toHaveBeenCalledWith(
      expect.objectContaining({ leaseToken: "lease-token-private-123456789", leaseGeneration: 1 }),
      expect.objectContaining({ status: "VERIFYING", providerReportedTests: "PASS" }),
    );
    expect(result.reason).toContain("independent verification and human review");
  });

  it("aborts and records a timeout rather than retrying a slow provider", async () => {
    const db = adapters();
    const execute = vi.fn((_task, _context, _signal) => new Promise<unknown>(() => undefined));
    const result = await runAgentWorkerCycle(input({
      timeoutMs: 1000,
      heartbeatIntervalMs: 250,
      adapters: db,
      provider: provider({ execute }),
    }));
    expect(result).toMatchObject({ outcome: "TIMED_OUT", code: "EXECUTION_TIMEOUT" });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(db.recordFailureFenced).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ code: "EXECUTION_TIMEOUT" }),
    );
    expect(db.recordResultFenced).not.toHaveBeenCalled();
  });

  it("aborts and refuses to persist when the heartbeat fence is rejected", async () => {
    const db = adapters({ heartbeatFenced: vi.fn(async () => false) });
    const execute = vi.fn((_task, _context, signal) => new Promise<unknown>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("provider observed abort")), { once: true });
    }));
    const result = await runAgentWorkerCycle(input({
      heartbeatIntervalMs: 100,
      adapters: db,
      provider: provider({ execute }),
    }));
    expect(result).toMatchObject({ outcome: "LEASE_LOST", code: "LEASE_LOST" });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(db.recordResultFenced).not.toHaveBeenCalled();
    expect(db.recordFailureFenced).not.toHaveBeenCalled();
  });

  it("rejects provider claims of DONE/ACCEPTED/INTEGRATED and records only a safe error code", async () => {
    const db = adapters();
    const result = await runAgentWorkerCycle(input({
      adapters: db,
      provider: provider({ execute: vi.fn(async () => ({
        status: "INTEGRATED",
        summary: "done",
        evidenceRefs: [],
        changedPaths: [],
        providerReportedTests: "PASS",
        uncertainties: [],
        nextAction: "merge",
      })) }),
    }));
    expect(result).toMatchObject({ outcome: "INVALID_PROVIDER_RESULT", code: "PROVIDER_RESULT_INVALID" });
    expect(db.recordResultFenced).not.toHaveBeenCalled();
    expect(db.recordFailureFenced).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ code: "PROVIDER_RESULT_INVALID" }),
    );
    expect(JSON.stringify(result)).not.toMatch(/secret|token/i);
  });

  it("rejects evidence containing credentials or changed paths outside task scope", async () => {
    const secret = await runAgentWorkerCycle(input({
      provider: provider({ execute: vi.fn(async () => ({
        status: "VERIFYING",
        summary: "token=super-secret-value",
        evidenceRefs: [],
        changedPaths: [],
        providerReportedTests: "NOT_RUN",
        uncertainties: [],
        nextAction: "Review",
      })) }),
    }));
    expect(secret).toMatchObject({ outcome: "INVALID_PROVIDER_RESULT" });

    const outsideScope = await runAgentWorkerCycle(input({
      provider: provider({ execute: vi.fn(async () => ({
        status: "VERIFYING",
        summary: "Review complete",
        evidenceRefs: [],
        changedPaths: ["supabase/migrations/secret.sql"],
        providerReportedTests: "NOT_RUN",
        uncertainties: [],
        nextAction: "Review",
      })) }),
    }));
    expect(outsideScope).toMatchObject({ outcome: "INVALID_PROVIDER_RESULT" });
  });

  it("returns LEASE_LOST if fenced result persistence rejects the generation/token", async () => {
    const result = await runAgentWorkerCycle(input({
      adapters: adapters({ recordResultFenced: vi.fn(async () => false) }),
    }));
    expect(result).toMatchObject({ outcome: "LEASE_LOST", code: "LEASE_LOST" });
  });

  it("does not treat provider-reported tests as independent verification", async () => {
    const result = await runAgentWorkerCycle(input());
    expect(result.outcome).toBe("REVIEW_REQUIRED");
    expect(result.providerResult?.providerReportedTests).toBe("PASS");
    expect(result.reason).toContain("independent verification");
  });
});
