import { describe, expect, it, vi } from "vitest";

import {
  runAgentWorkerSupervisor,
  type AgentWorkerSupervisorAdapters,
  type AgentWorkerSupervisorHeartbeat,
} from "./agent-worker-supervisor";
import type { WorkerCycleResult } from "./agent-worker-runtime";

const CYCLE_A = "123e4567-e89b-42d3-a456-426614174001";
const CYCLE_B = "123e4567-e89b-42d3-a456-426614174002";

function result(taskId: string): WorkerCycleResult {
  return {
    outcome: "REVIEW_REQUIRED",
    taskId,
    reason: "Independent verification and human review are still required.",
  };
}

function abortOnSleep(
  controller: AbortController,
  stopAfter: number,
  delays: number[],
): (milliseconds: number, signal: AbortSignal) => Promise<void> {
  let calls = 0;
  return async (milliseconds) => {
    delays.push(milliseconds);
    calls += 1;
    if (calls >= stopAfter) controller.abort();
  };
}

function baseAdapters(
  overrides: Partial<AgentWorkerSupervisorAdapters> = {},
): AgentWorkerSupervisorAdapters {
  return {
    readEnabled: vi.fn(async () => true),
    selectNextReadyTask: vi.fn(async () => null),
    createCycleId: vi.fn(() => CYCLE_A),
    runCycle: vi.fn(async (taskId: string) => result(taskId)),
    writeHeartbeat: vi.fn(async (_heartbeat: AgentWorkerSupervisorHeartbeat) => undefined),
    now: () => new Date("2026-10-24T12:00:00.000Z"),
    random: () => 0.5,
    sleep: async () => undefined,
    ...overrides,
  };
}

describe("bounded agent worker supervisor", () => {
  it("honours the kill switch on every tick without selecting or dispatching tasks", async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    const heartbeatRows: AgentWorkerSupervisorHeartbeat[] = [];
    const adapters = baseAdapters({
      readEnabled: vi.fn(async () => false),
      selectNextReadyTask: vi.fn(async () => "task-must-not-be-read"),
      runCycle: vi.fn(async (taskId) => result(taskId)),
      writeHeartbeat: vi.fn(async (heartbeat: AgentWorkerSupervisorHeartbeat) => {
        heartbeatRows.push(heartbeat);
      }),
      sleep: abortOnSleep(controller, 2, delays),
    });

    const summary = await runAgentWorkerSupervisor(adapters, controller.signal, {
      pollIntervalMs: 1000,
      maxBackoffMs: 4000,
    });

    expect(adapters.readEnabled).toHaveBeenCalledTimes(2);
    expect(adapters.selectNextReadyTask).not.toHaveBeenCalled();
    expect(adapters.runCycle).not.toHaveBeenCalled();
    expect(delays).toEqual([1000, 1000]);
    expect(heartbeatRows.some((row) => row.status === "PAUSED")).toBe(true);
    expect(heartbeatRows.at(-1)?.status).toBe("STOPPED");
    expect(summary).toMatchObject({ status: "STOPPED", completedCycles: 0 });
  });

  it("runs one task at a time and creates a fresh UUID for each cycle", async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    const queue = ["task-a", "task-b"];
    const ids = [CYCLE_A, CYCLE_B];
    let activeRuns = 0;
    let maximumConcurrentRuns = 0;
    const runCycle = vi.fn(async (taskId: string) => {
      activeRuns += 1;
      maximumConcurrentRuns = Math.max(maximumConcurrentRuns, activeRuns);
      await Promise.resolve();
      activeRuns -= 1;
      return result(taskId);
    });
    const adapters = baseAdapters({
      selectNextReadyTask: vi.fn(async () => queue.shift() ?? null),
      createCycleId: vi.fn(() => {
        const id = ids.shift();
        if (!id) throw new Error("No test UUID remains.");
        return id;
      }),
      runCycle,
      sleep: abortOnSleep(controller, 2, delays),
    });

    const summary = await runAgentWorkerSupervisor(adapters, controller.signal, {
      pollIntervalMs: 1000,
      maxBackoffMs: 4000,
    });

    expect(runCycle.mock.calls.map(([taskId]) => taskId)).toEqual(["task-a", "task-b"]);
    expect(adapters.createCycleId).toHaveBeenCalledTimes(2);
    expect(maximumConcurrentRuns).toBe(1);
    expect(summary.completedCycles).toBe(2);
    expect(summary.lastOutcome).toBe("REVIEW_REQUIRED");
    expect(delays).toEqual([1000, 1000]);
  });

  it("backs off with a cap and never puts exception diagnostics in liveness records", async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    const heartbeatRows: AgentWorkerSupervisorHeartbeat[] = [];
    const adapters = baseAdapters({
      selectNextReadyTask: vi.fn(async () => {
        throw new Error("token=super-secret-value");
      }),
      writeHeartbeat: vi.fn(async (heartbeat: AgentWorkerSupervisorHeartbeat) => {
        heartbeatRows.push(heartbeat);
      }),
      sleep: abortOnSleep(controller, 3, delays),
    });

    const summary = await runAgentWorkerSupervisor(adapters, controller.signal, {
      pollIntervalMs: 1000,
      maxBackoffMs: 2000,
    });

    expect(delays).toEqual([1000, 2000, 2000]);
    expect(summary.consecutiveFailures).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(heartbeatRows)).not.toContain("super-secret-value");
    expect(heartbeatRows.some((row) => row.status === "DEGRADED")).toBe(true);
  });

  it("does not invoke a task if its running heartbeat cannot be persisted", async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    const runCycle = vi.fn(async (taskId: string) => result(taskId));
    const adapters = baseAdapters({
      selectNextReadyTask: vi.fn(async () => "task-a"),
      writeHeartbeat: vi.fn(async (heartbeat: AgentWorkerSupervisorHeartbeat) => {
        if (heartbeat.status === "RUNNING") {
          throw new Error("database token=private-detail");
        }
      }),
      runCycle,
      sleep: abortOnSleep(controller, 1, delays),
    });

    await runAgentWorkerSupervisor(adapters, controller.signal, {
      pollIntervalMs: 1000,
      maxBackoffMs: 2000,
    });

    expect(runCycle).not.toHaveBeenCalled();
    expect(delays).toEqual([1000]);
  });

  it("fails closed on malformed task IDs or cycle UUIDs", async () => {
    for (const scenario of [
      { taskId: " ", cycleId: CYCLE_A },
      { taskId: "task-a", cycleId: "not-a-uuid" },
    ]) {
      const controller = new AbortController();
      const delays: number[] = [];
      const runCycle = vi.fn(async (taskId: string) => result(taskId));
      const adapters = baseAdapters({
        selectNextReadyTask: vi.fn(async () => scenario.taskId),
        createCycleId: vi.fn(() => scenario.cycleId),
        runCycle,
        sleep: abortOnSleep(controller, 1, delays),
      });

      await runAgentWorkerSupervisor(adapters, controller.signal, {
        pollIntervalMs: 1000,
        maxBackoffMs: 2000,
      });

      expect(runCycle).not.toHaveBeenCalled();
      expect(delays).toEqual([1000]);
    }
  });

  it("backs off when consecutive status-heartbeat writes fail", async () => {
    const controller = new AbortController();
    const delays: number[] = [];
    const persisted: AgentWorkerSupervisorHeartbeat[] = [];
    let writes = 0;
    const adapters = baseAdapters({
      selectNextReadyTask: vi.fn(async () => null),
      writeHeartbeat: vi.fn(async (heartbeat: AgentWorkerSupervisorHeartbeat) => {
        writes += 1;
        if (writes <= 2) throw new Error("token=heartbeat-secret");
        persisted.push(heartbeat);
      }),
      sleep: abortOnSleep(controller, 2, delays),
    });

    const summary = await runAgentWorkerSupervisor(adapters, controller.signal, {
      pollIntervalMs: 1000,
      maxBackoffMs: 4000,
    });

    expect(delays).toEqual([1000, 2000]);
    expect(summary.consecutiveFailures).toBe(2);
    expect(persisted.every((heartbeat) => heartbeat.status === "STOPPED")).toBe(true);
    expect(JSON.stringify(persisted)).not.toContain("heartbeat-secret");
  });

  it("rejects invalid intervals instead of creating a fast retry loop", async () => {
    const controller = new AbortController();
    const adapters = baseAdapters();

    await expect(
      runAgentWorkerSupervisor(adapters, controller.signal, {
        pollIntervalMs: 10,
        maxBackoffMs: 2000,
      }),
    ).rejects.toThrow("Supervisor polling interval is outside the allowed range.");
    expect(adapters.readEnabled).not.toHaveBeenCalled();
  });
});
