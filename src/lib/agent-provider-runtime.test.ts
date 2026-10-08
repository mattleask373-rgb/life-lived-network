import { describe, expect, it } from "vitest";
import type { AgentExecutionResult } from "./agent-execution-contract";
import { executeProviderAttempt } from "./agent-provider-runtime";
import type { AgentProvider } from "./agent-provider";
import type { AgentTaskEnvelope } from "./agent-orchestration";

const task: AgentTaskEnvelope = {
  task_id: "task-1",
  source: { system: "plane", workspace_id: "workspace-1", work_item_id: "work-1", event_id: "event-1" },
  objective: "Perform a bounded implementation task",
  lane: "IMPLEMENTATION",
  autonomy: "L2",
  risk: "P3",
  scope_in: ["src/lib/example.ts"],
  scope_out: ["main", "production"],
  dependencies: [],
  acceptance_criteria: ["Return structured evidence"],
  invariants: ["No autonomous merge to main"],
  provider: "auto",
};

function result(overrides: Partial<AgentExecutionResult> = {}): AgentExecutionResult {
  return {
    taskId: task.task_id,
    status: "VERIFYING",
    summary: "Changed one file and produced evidence.",
    changedPaths: ["src/lib/example.ts"],
    testsRun: [{ command: "bun test", result: "pass", evidence: "1 test passed" }],
    testsPassed: 1,
    testsFailed: 0,
    claims: [{ statement: "The bounded change was applied.", supportedBy: ["git diff"], confidence: "observed" }],
    uncertainties: [],
    blockers: [],
    handoff: "Independent verification remains required before any consequential transition.",
    recommendedNextAction: "Review the evidence and run the repository verification workflow.",
    provider: { id: "test-provider" },
    ...overrides,
  };
}

function provider(overrides: Partial<AgentProvider> = {}): AgentProvider {
  return {
    id: "test-provider",
    displayName: "Test Provider",
    capabilities: ["implementation"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P3",
    costClass: "free",
    reliabilityClass: "standard",
    health: async () => ({ status: "available", checkedAt: new Date().toISOString() }),
    execute: async () => result(),
    ...overrides,
  };
}

describe("phase-2 provider runtime", () => {
  it("accepts a valid provider result without promoting it to completion", async () => {
    const envelope = await executeProviderAttempt(provider(), task, { timeoutMs: 1000 });
    expect(envelope.result.status).toBe("VERIFYING");
    expect(envelope.providerId).toBe("test-provider");
    expect(envelope.startedAt).toBeTruthy();
    expect(envelope.finishedAt).toBeTruthy();
  });

  it("turns provider unavailability into explicit failure evidence", async () => {
    const envelope = await executeProviderAttempt(
      provider({ health: async () => ({ status: "unavailable", checkedAt: new Date().toISOString(), detail: "provider offline" }) }),
      task,
      { timeoutMs: 1000 },
    );
    expect(envelope.result.status).toBe("FAILED");
    expect(envelope.result.summary).toContain("provider offline");
    expect(envelope.result.recommendedNextAction).toContain("retry policy");
  });

  it("rejects malformed provider evidence instead of accepting it", async () => {
    const envelope = await executeProviderAttempt(
      provider({ execute: async () => result({ status: "DONE" as never }) }),
      task,
      { timeoutMs: 1000 },
    );
    expect(envelope.result.status).toBe("FAILED");
    expect(envelope.result.summary).toContain("malformed");
  });

  it("converts an execution timeout into explicit failure", async () => {
    const envelope = await executeProviderAttempt(
      provider({
        execute: (_task, signal) =>
          new Promise<AgentExecutionResult>((_resolve, reject) => {
            signal?.addEventListener("abort", () => reject(new Error("timed out")), { once: true });
          }),
      }),
      task,
      { timeoutMs: 5 },
    );
    expect(envelope.result.status).toBe("FAILED");
    expect(envelope.result.uncertainties.join(" ")).toContain("PROVIDER_TIMEOUT");
  });

  it("honours caller cancellation as a fail-closed timeout boundary", async () => {
    const controller = new AbortController();
    const promise = executeProviderAttempt(
      provider({
        execute: (_task, signal) =>
          new Promise<AgentExecutionResult>((_resolve, reject) => {
            signal?.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
          }),
      }),
      task,
      { timeoutMs: 1000, signal: controller.signal },
    );
    controller.abort();
    const envelope = await promise;
    expect(envelope.result.status).toBe("FAILED");
  });
});
